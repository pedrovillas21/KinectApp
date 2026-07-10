package com.kinetic.services;

import com.kinetic.dtos.EmpresaAnalyticsDTO;
import com.kinetic.dtos.EmpresaStudentLinkDTO;
import com.kinetic.dtos.FeedbackDTO;
import com.kinetic.dtos.TrainerLinkDTO;
import com.kinetic.dtos.TrainerLinkDTO.PeerDTO;
import com.kinetic.dtos.UserAdminDTO;
import com.kinetic.enums.Role;
import com.kinetic.enums.TrainerLinkStatus;
import com.kinetic.models.User;
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
import java.util.List;
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

    @Transactional(readOnly = true)
    public List<UserAdminDTO> listFuncionarios(String empresaEmail) {
        UUID companyId = resolveCompanyId(empresaEmail);
        return userRepository.findByCompanyIdAndRole(companyId, Role.PERSONAL).stream()
                .map(UserAdminDTO::fromEntity)
                .toList();
    }

    @Transactional
    public UserAdminDTO vincularFuncionario(String empresaEmail, String personalEmail) {
        UUID companyId = resolveCompanyId(empresaEmail);
        User personal = userRepository.getByEmailOrThrow(personalEmail);
        if (personal.getRole() != Role.PERSONAL) {
            throw new IllegalArgumentException("O e-mail informado não pertence a um personal.");
        }
        personal.setCompanyId(companyId);
        return UserAdminDTO.fromEntity(userRepository.save(personal));
    }

    @Transactional
    public void desvincularFuncionario(String empresaEmail, UUID personalId) {
        UUID companyId = resolveCompanyId(empresaEmail);
        User personal = userRepository.findById(personalId)
                .orElseThrow(() -> new EntityNotFoundException("Personal não encontrado."));
        if (!companyId.equals(personal.getCompanyId())) {
            throw new EntityNotFoundException("Personal não encontrado.");
        }
        // Desvincula o funcionário; os vínculos com alunos ficam como estão
        // (encerre-os individualmente em Clientes, se necessário).
        personal.setCompanyId(null);
        userRepository.save(personal);
    }

    // ── Clientes (alunos via vínculo COMPANY) ─────────────────────────────────

    @Transactional(readOnly = true)
    public List<EmpresaStudentLinkDTO> listClientes(String empresaEmail) {
        UUID companyId = resolveCompanyId(empresaEmail);
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
        User trainer = userRepository.getByEmailOrThrow(trainerEmail);
        User student = userRepository.getByEmailOrThrow(studentEmail);
        return trainerLinkService.assignStudentToTrainer(companyId, trainer.getId(), student.getId());
    }

    @Transactional
    public void desvincularAluno(String empresaEmail, UUID linkId) {
        UUID companyId = resolveCompanyId(empresaEmail);
        trainerLinkService.endCompanyLink(companyId, linkId);
    }

    // ── Feedbacks ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<FeedbackDTO> listFeedbacks(String empresaEmail) {
        return feedbackService.listForCompany(resolveCompanyId(empresaEmail));
    }

    // ── Analytics ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public EmpresaAnalyticsDTO getAnalytics(String empresaEmail, String period) {
        UUID companyId = resolveCompanyId(empresaEmail);
        LocalDate startDate = periodStartDate(period);
        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDate today = LocalDate.now();

        long personaisAtivos = userRepository.countByCompanyIdAndRole(companyId, Role.PERSONAL);
        long alunosAtivos = trainerClientRepository.countByCompanyIdAndStatus(companyId, TrainerLinkStatus.ATIVO);
        long vinculadosNoPeriodo =
                trainerClientRepository.countByCompanyIdAndCreatedAtGreaterThanEqual(companyId, startDateTime);
        long ativosNoPeriodo = trainerClientRepository
                .countByCompanyIdAndStatusAndCreatedAtGreaterThanEqual(companyId, TrainerLinkStatus.ATIVO, startDateTime);
        double retention = vinculadosNoPeriodo == 0 ? 0.0 : (double) ativosNoPeriodo / vinculadosNoPeriodo;

        // Volume da unidade: sessões dos alunos ATIVOS da empresa no período.
        List<UUID> studentIds = trainerClientRepository
                .findByCompanyAndStatusFetch(companyId, TrainerLinkStatus.ATIVO).stream()
                .map(link -> link.getStudent().getId())
                .toList();

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
                .countActiveStudentsPerTrainer(companyId, TrainerLinkStatus.ATIVO).stream()
                .map(row -> new EmpresaAnalyticsDTO.InstructorPerf(
                        (UUID) row[0], (String) row[1], ((Number) row[2]).longValue()))
                .toList();

        return new EmpresaAnalyticsDTO(
                personaisAtivos, alunosAtivos, vinculadosNoPeriodo, retention,
                sessoesNoPeriodo, volumeSeries, desempenho);
    }

    private PeerDTO peer(User u) {
        return new PeerDTO(u.getId(), u.getNome(), u.getEmail(), u.getAvatarUrl());
    }

    private LocalDate periodStartDate(String period) {
        LocalDate today = LocalDate.now();
        return switch (period == null ? "month" : period) {
            case "week" -> today.minusDays(7);
            case "q" -> today.minusDays(90);
            case "year" -> today.minusDays(365);
            default -> today.minusDays(30);
        };
    }
}
