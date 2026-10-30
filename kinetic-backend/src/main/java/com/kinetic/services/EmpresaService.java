package com.kinetic.services;

import com.kinetic.utils.AppTime;

import com.kinetic.dtos.EmpresaAnalyticsDTO;
import com.kinetic.dtos.EmpresaStudentLinkDTO;
import com.kinetic.dtos.FeedbackDTO;
import com.kinetic.dtos.TrainerCompanyDTO;
import com.kinetic.dtos.TrainerLinkDTO;
import com.kinetic.dtos.TrainerLinkDTO.PeerDTO;
import com.kinetic.dtos.UserAdminDTO;
import com.kinetic.enums.AuditAction;
import com.kinetic.enums.Role;
import com.kinetic.enums.TrainerLinkStatus;
import com.kinetic.exceptions.ActiveTrainerConflictException;
import com.kinetic.models.User;
import com.kinetic.repositories.CompanyRepository;
import com.kinetic.repositories.TrainerClientRepository;
import com.kinetic.repositories.UserRepository;
import com.kinetic.repositories.WorkoutSessionRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Casos de uso da EMPRESA, sempre escopados pela company_id do usuário logado:
 * gestão de funcionários (personais) e clientes (alunos, via vínculo COMPANY),
 * analytics de retenção/volume e leitura de feedbacks.
 */
@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class EmpresaService {

    private final UserRepository userRepository;
    private final TrainerClientRepository trainerClientRepository;
    private final WorkoutSessionRepository workoutSessionRepository;
    private final TrainerLinkService trainerLinkService;
    private final FeedbackService feedbackService;
    private final CompanyRepository companyRepository;
    private final TrainerEventService trainerEventService;
    private final AuditService auditService;

    /** company_id do usuário EMPRESA logado; erro se a conta não tiver empresa. */
    @Transactional(readOnly = true)
    public UUID resolveCompanyId(String empresaEmail) {
        User user = userRepository.getByEmailOrThrow(empresaEmail);
        UUID companyId = user.getCompanyId();
        if (companyId == null) {
            throw new IllegalArgumentException("Sua conta não está vinculada a nenhuma empresa.");
        }
        return companyId;
    }

    // ── Funcionários (personais) ──────────────────────────────────────────────

    /** Funcionários e convites ainda não aceitos (estes vêm com companyId nulo). */
    @Transactional(readOnly = true)
    public List<UserAdminDTO> listFuncionarios(String empresaEmail) {
        return listFuncionariosOf(resolveCompanyId(empresaEmail));
    }

    /** Mesma lista por id da filial (o dono da rede vê as filiais por aqui). */
    @Transactional(readOnly = true)
    public List<UserAdminDTO> listFuncionariosOf(UUID companyId) {
        List<UserAdminDTO> result = new ArrayList<>();
        userRepository.findByCompanyIdAndRole(companyId, Role.PERSONAL).forEach(u -> result.add(UserAdminDTO.fromEntity(u)));
        userRepository.findByPendingCompanyIdAndRole(companyId, Role.PERSONAL).forEach(u -> result.add(UserAdminDTO.fromEntity(u)));
        return result;
    }

    /**
     * Convida o personal para a empresa. Ele só vira funcionário (e sai da cobrança
     * individual) quando aceitar no painel; até lá nada muda na conta dele.
     */
    @Transactional
    public UserAdminDTO vincularFuncionario(String empresaEmail, String personalEmail) {
        UUID companyId = resolveCompanyId(empresaEmail);
        // Mesmo 404 para e-mail inexistente e conta que não é personal: não revela o papel da conta.
        User personal = userRepository.findByEmail(personalEmail)
                .filter(u -> u.getRole() == Role.PERSONAL)
                .orElseThrow(() -> new EntityNotFoundException("Personal não encontrado."));
        if (companyId.equals(personal.getCompanyId())) {
            return UserAdminDTO.fromEntity(personal);
        }
        if (personal.getCompanyId() != null) {
            // Sem isso, outra empresa sobrescreveria o company_id e "roubaria" o funcionário.
            throw new ActiveTrainerConflictException("Este personal já está vinculado a outra empresa.");
        }
        if (personal.getPendingCompanyId() != null && !companyId.equals(personal.getPendingCompanyId())) {
            throw new ActiveTrainerConflictException("Este personal já tem um convite pendente de outra empresa.");
        }
        personal.setPendingCompanyId(companyId);
        User saved = userRepository.save(personal);
        auditService.record(AuditAction.TRAINER_INVITED_TO_COMPANY, saved.getId(), companyId, null, null);
        trainerEventService.publishAfterCommit(saved.getId(), "company", null);
        return UserAdminDTO.fromEntity(saved);
    }

    /** Desvincula um funcionário ou cancela o convite pendente dele. */
    @Transactional
    public void desvincularFuncionario(String empresaEmail, UUID personalId) {
        UUID companyId = resolveCompanyId(empresaEmail);
        User personal = userRepository.findById(personalId)
                .orElseThrow(() -> new EntityNotFoundException("Personal não encontrado."));
        if (companyId.equals(personal.getPendingCompanyId())) {
            personal.setPendingCompanyId(null);
            userRepository.save(personal);
            auditService.record(AuditAction.TRAINER_REMOVED_FROM_COMPANY, personal.getId(), companyId, null,
                    Map.of("pendingInvite", true));
            return;
        }
        if (!companyId.equals(personal.getCompanyId())) {
            throw new EntityNotFoundException("Personal não encontrado.");
        }
        leaveCompany(personal, companyId);
        auditService.record(AuditAction.TRAINER_REMOVED_FROM_COMPANY, personal.getId(), companyId, null,
                Map.of("pendingInvite", false));
    }

    // ── Lado do personal: convite e saída da empresa ──────────────────────────

    /** Empresa atual e convite pendente do personal logado (cada um pode ser nulo). */
    @Transactional(readOnly = true)
    public TrainerCompanyDTO getTrainerCompany(String personalEmail) {
        User personal = userRepository.getByEmailOrThrow(personalEmail);
        return new TrainerCompanyDTO(companyRef(personal.getCompanyId()), companyRef(personal.getPendingCompanyId()));
    }

    @Transactional
    public TrainerCompanyDTO acceptCompanyInvite(String personalEmail) {
        User personal = userRepository.getByEmailOrThrow(personalEmail);
        if (personal.getPendingCompanyId() == null) {
            throw new EntityNotFoundException("Nenhum convite de empresa pendente.");
        }
        if (personal.getCompanyId() != null) {
            throw new ActiveTrainerConflictException("Saia da empresa atual antes de aceitar outro convite.");
        }
        personal.setCompanyId(personal.getPendingCompanyId());
        personal.setPendingCompanyId(null);
        userRepository.save(personal);
        auditService.record(AuditAction.COMPANY_INVITE_ACCEPTED, personal.getId(), personal.getCompanyId(), null, null);
        return getTrainerCompany(personalEmail);
    }

    @Transactional
    public void declineCompanyInvite(String personalEmail) {
        User personal = userRepository.getByEmailOrThrow(personalEmail);
        UUID pending = personal.getPendingCompanyId();
        personal.setPendingCompanyId(null);
        userRepository.save(personal);
        if (pending != null) {
            auditService.record(AuditAction.COMPANY_INVITE_DECLINED, personal.getId(), pending, null, null);
        }
    }

    /** O personal sai da empresa por conta própria. */
    @Transactional
    public void leaveCompanyByTrainer(String personalEmail) {
        User personal = userRepository.getByEmailOrThrow(personalEmail);
        if (personal.getCompanyId() == null) {
            throw new EntityNotFoundException("Você não está vinculado a nenhuma empresa.");
        }
        UUID companyId = personal.getCompanyId();
        leaveCompany(personal, companyId);
        auditService.record(AuditAction.TRAINER_LEFT_COMPANY, personal.getId(), companyId, null, null);
    }

    /** Tira o personal da empresa e encerra os alunos que ela atribuiu a ele. */
    private void leaveCompany(User personal, UUID companyId) {
        personal.setCompanyId(null);
        userRepository.save(personal);
        trainerLinkService.endCompanyLinksOfTrainer(companyId, personal.getId());
    }

    private TrainerCompanyDTO.CompanyRef companyRef(UUID companyId) {
        if (companyId == null) {
            return null;
        }
        return companyRepository.findById(companyId)
                .map(c -> new TrainerCompanyDTO.CompanyRef(c.getId(), c.getNome()))
                .orElse(null);
    }

    // ── Clientes (alunos via vínculo COMPANY) ─────────────────────────────────

    @Transactional(readOnly = true)
    public List<EmpresaStudentLinkDTO> listClientes(String empresaEmail) {
        return listClientesOf(resolveCompanyId(empresaEmail));
    }

    @Transactional(readOnly = true)
    public List<EmpresaStudentLinkDTO> listClientesOf(UUID companyId) {
        return trainerClientRepository
                .findByCompanyAndStatusFetch(companyId, TrainerLinkStatus.ATIVO).stream()
                .map(link -> new EmpresaStudentLinkDTO(
                        link.getId(),
                        peer(link.getStudent()),
                        peer(link.getTrainer()),
                        link.getCreatedAt()))
                .toList();
    }

    @Transactional
    public TrainerLinkDTO vincularAluno(String empresaEmail, String studentEmail, String trainerEmail) {
        UUID companyId = resolveCompanyId(empresaEmail);
        User trainer = userRepository.findByEmail(trainerEmail)
                .orElseThrow(() -> new EntityNotFoundException("Personal não encontrado."));
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new IllegalArgumentException(TrainerLinkService.INVITE_NOT_POSSIBLE));
        // Cria um convite PENDENTE: o vínculo só fica ATIVO quando o aluno aceitar no app.
        TrainerLinkDTO link = trainerLinkService.assignStudentToTrainer(companyId, trainer.getId(), student.getId());
        auditService.record(AuditAction.STUDENT_LINKED_BY_COMPANY, student.getId(), companyId, null,
                Map.of("trainerId", trainer.getId(), "linkId", link.id()));
        return link;
    }

    @Transactional
    public void desvincularAluno(String empresaEmail, UUID linkId) {
        UUID companyId = resolveCompanyId(empresaEmail);
        trainerLinkService.endCompanyLink(companyId, linkId);
        auditService.record(AuditAction.COMPANY_LINK_ENDED, linkId, companyId, null, null);
    }

    // ── Feedbacks ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<FeedbackDTO> listFeedbacks(String empresaEmail) {
        return feedbackService.listForCompany(resolveCompanyId(empresaEmail));
    }

    // ── Analytics ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public EmpresaAnalyticsDTO getAnalytics(String empresaEmail, String period) {
        return getAnalyticsOf(List.of(resolveCompanyId(empresaEmail)), period);
    }

    /**
     * Indicadores de uma ou mais empresas somados (a rede do dono passa todas as filiais):
     * o número de consultas não cresce com o número de filiais.
     */
    @Transactional(readOnly = true)
    public EmpresaAnalyticsDTO getAnalyticsOf(Collection<UUID> companyIds, String period) {
        if (companyIds.isEmpty()) {
            return new EmpresaAnalyticsDTO(0, 0, 0, 0.0, 0, List.of(), List.of());
        }
        LocalDate startDate = AppTime.today().minusDays(CompanyService.periodDays(period));
        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDate today = AppTime.today();

        long personaisAtivos = userRepository.countByCompanyIdInAndRole(companyIds, Role.PERSONAL);
        long alunosAtivos = trainerClientRepository.countByCompanyIdInAndStatus(companyIds, TrainerLinkStatus.ATIVO);
        long vinculadosNoPeriodo =
                trainerClientRepository.countByCompanyIdInAndCreatedAtGreaterThanEqual(companyIds, startDateTime);
        long ativosNoPeriodo = trainerClientRepository
                .countByCompanyIdInAndStatusAndCreatedAtGreaterThanEqual(companyIds, TrainerLinkStatus.ATIVO, startDateTime);
        double retention = vinculadosNoPeriodo == 0 ? 0.0 : (double) ativosNoPeriodo / vinculadosNoPeriodo;

        // Volume: sessões dos alunos ATIVOS das empresas no período.
        List<UUID> studentIds = trainerClientRepository.findStudentIdsByCompanies(companyIds, TrainerLinkStatus.ATIVO);

        List<EmpresaAnalyticsDTO.VolumePoint> volumeSeries = new ArrayList<>();
        long sessoesNoPeriodo = 0;
        if (!studentIds.isEmpty()) {
            for (Object[] row : workoutSessionRepository.countSessionsPerDayForUsers(studentIds, startDate, today)) {
                String date = row[0].toString();
                long count = ((Number) row[1]).longValue();
                sessoesNoPeriodo += count;
                volumeSeries.add(new EmpresaAnalyticsDTO.VolumePoint(date, count));
            }
        }

        List<EmpresaAnalyticsDTO.InstructorPerf> desempenho = trainerClientRepository
                .countActiveStudentsPerTrainer(companyIds, TrainerLinkStatus.ATIVO).stream()
                .map(row -> new EmpresaAnalyticsDTO.InstructorPerf(
                        (UUID) row[0], (String) row[1], ((Number) row[2]).longValue()))
                .toList();

        return new EmpresaAnalyticsDTO(
                personaisAtivos, alunosAtivos, vinculadosNoPeriodo, retention,
                sessoesNoPeriodo, volumeSeries, desempenho);
    }

    private PeerDTO peer(User u) {
        return new PeerDTO(u.getId(), u.getNome(), u.getEmail(), u.getAvatarUrl(), null);
    }
}
