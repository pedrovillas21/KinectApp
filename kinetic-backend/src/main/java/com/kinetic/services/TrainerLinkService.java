package com.kinetic.services;

import com.kinetic.dtos.TrainerLinkDTO;
import com.kinetic.enums.Role;
import com.kinetic.enums.TrainerLinkSource;
import com.kinetic.enums.TrainerLinkStatus;
import com.kinetic.exceptions.ActiveTrainerConflictException;
import com.kinetic.models.TrainerClient;
import com.kinetic.models.User;
import com.kinetic.repositories.TrainerClientRepository;
import com.kinetic.repositories.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Regras do vínculo personal↔aluno. A validação de "1 personal ATIVO por
 * aluno" acontece em duas camadas: a checagem explícita aqui (mensagem de
 * erro amigável no caminho comum) e o índice único parcial no banco (defesa
 * final sob concorrência — capturado como DataIntegrityViolationException
 * e traduzido em 409).
 */
@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class TrainerLinkService {

    private final TrainerClientRepository trainerClientRepository;
    private final UserRepository userRepository;
    private final BillingService billingService;
    private final TrainerEventService trainerEventService;

    @Transactional
    public TrainerLinkDTO invite(String trainerEmail, String studentEmail) {
        User trainer = userRepository.getByEmailOrThrow(trainerEmail);
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Aluno não encontrado. No MVP o convite exige aluno já cadastrado."));

        if (trainer.getId().equals(student.getId())) {
            throw new IllegalArgumentException("Você não pode convidar a si mesmo.");
        }
        if (student.getRole() != Role.ALUNO) {
            throw new IllegalArgumentException("O e-mail informado não pertence a um aluno.");
        }
        if (trainerClientRepository.existsByStudentIdAndStatus(student.getId(), TrainerLinkStatus.ATIVO)) {
            throw new ActiveTrainerConflictException("Este aluno já possui um personal ativo.");
        }
        if (trainerClientRepository.existsByTrainerIdAndStudentIdAndStatus(
                trainer.getId(), student.getId(), TrainerLinkStatus.PENDENTE)) {
            throw new ActiveTrainerConflictException("Já existe um convite pendente para este aluno.");
        }
        billingService.assertCanAddStudent(trainer, false);

        TrainerClient link = new TrainerClient();
        link.setTrainer(trainer);
        link.setStudent(student);
        link.setStatus(TrainerLinkStatus.PENDENTE);
        link.setSource(TrainerLinkSource.INVITE);

        try {
            TrainerLinkDTO dto = toDto(trainerClientRepository.saveAndFlush(link), student);
            trainerEventService.publishAfterCommit(trainer.getId(), "students", student.getId());
            return dto;
        } catch (DataIntegrityViolationException e) {
            // Corrida com outro convite/aceite: o índice único parcial barrou.
            throw new ActiveTrainerConflictException("Já existe um convite pendente para este aluno.");
        }
    }

    @Transactional(readOnly = true)
    public List<TrainerLinkDTO> listPendingInvites(String studentEmail) {
        User student = userRepository.getByEmailOrThrow(studentEmail);
        return trainerClientRepository
                .findByStudentAndStatusFetchTrainer(student.getId(), TrainerLinkStatus.PENDENTE)
                .stream()
                .map(link -> toDto(link, link.getTrainer()))
                .toList();
    }

    @Transactional
    public TrainerLinkDTO accept(String studentEmail, @NonNull UUID inviteId) {
        User student = userRepository.getByEmailOrThrow(studentEmail);
        TrainerClient link = getOwnedPendingInvite(student, inviteId);

        if (trainerClientRepository.existsByStudentIdAndStatus(student.getId(), TrainerLinkStatus.ATIVO)) {
            throw new ActiveTrainerConflictException("Você já possui um personal ativo.");
        }
        billingService.assertCanAddStudent(link.getTrainer(), true);

        link.setStatus(TrainerLinkStatus.ATIVO);
        link.setRespondedAt(LocalDateTime.now());
        try {
            return toDto(trainerClientRepository.saveAndFlush(link), link.getTrainer());
        } catch (DataIntegrityViolationException e) {
            // Dois aceites simultâneos: o índice único parcial deixou passar só um.
            throw new ActiveTrainerConflictException("Você já possui um personal ativo.");
        }
    }

    @Transactional
    public void decline(String studentEmail, @NonNull UUID inviteId) {
        User student = userRepository.getByEmailOrThrow(studentEmail);
        TrainerClient link = getOwnedPendingInvite(student, inviteId);
        link.setStatus(TrainerLinkStatus.RECUSADO);
        link.setRespondedAt(LocalDateTime.now());
        trainerClientRepository.save(link);
    }

    @Transactional(readOnly = true)
    public TrainerLinkDTO getMyTrainer(String studentEmail) {
        User student = userRepository.getByEmailOrThrow(studentEmail);
        TrainerClient link = trainerClientRepository
                .findByStudentIdAndStatus(student.getId(), TrainerLinkStatus.ATIVO)
                .orElseThrow(() -> new EntityNotFoundException("Você não possui personal ativo."));
        return toDto(link, link.getTrainer());
    }

    @Transactional(readOnly = true)
    public List<TrainerLinkDTO> listStudents(String trainerEmail) {
        User trainer = userRepository.getByEmailOrThrow(trainerEmail);
        Set<UUID> frozen = billingService.frozenStudentIds(trainer);
        return trainerClientRepository
                .findByTrainerAndStatusFetchStudent(trainer.getId(), TrainerLinkStatus.ATIVO)
                .stream()
                .map(link -> toDto(link, link.getStudent(), frozen.contains(link.getStudent().getId())))
                .toList();
    }

    /**
     * Resolve o e-mail de um aluno garantindo que ele pertence à carteira do
     * personal (vínculo ATIVO). Gate de posse dos endpoints de dashboard do
     * personal: sem vínculo, responde 404 — e não 403 — para não revelar a
     * existência do aluno.
     */
    @Transactional(readOnly = true)
    public String resolveOwnedStudentEmail(String trainerEmail, @NonNull UUID studentId) {
        return resolveOwnedStudent(trainerEmail, studentId).getEmail();
    }

    /** Mesmo gate de posse de {@link #resolveOwnedStudentEmail}, devolvendo a entidade. */
    @Transactional(readOnly = true)
    public User resolveOwnedStudent(String trainerEmail, @NonNull UUID studentId) {
        User trainer = userRepository.getByEmailOrThrow(trainerEmail);
        if (!trainerClientRepository.existsByTrainerIdAndStudentIdAndStatus(
                trainer.getId(), studentId, TrainerLinkStatus.ATIVO)) {
            throw new EntityNotFoundException("Aluno não encontrado.");
        }
        return userRepository.findById(studentId)
                .orElseThrow(() -> new EntityNotFoundException("Aluno não encontrado."));
    }

    /**
     * Gate dos endpoints que <i>alteram</i> dados do aluno (ficha, IA, avaliação,
     * protocolo, mensalidade): posse + aluno não congelado pelo limite do plano Grátis.
     * Leitura continua por {@link #resolveOwnedStudent}.
     */
    @Transactional(readOnly = true)
    public User resolveOwnedStudentForWrite(String trainerEmail, @NonNull UUID studentId) {
        User student = resolveOwnedStudent(trainerEmail, studentId);
        billingService.assertNotFrozen(userRepository.getByEmailOrThrow(trainerEmail), studentId);
        return student;
    }

    /**
     * Write-path corporativo: a EMPRESA atribui um aluno a um personal seu,
     * criando um vínculo já ATIVO com source=COMPANY. Respeita a mesma regra de
     * "1 personal ATIVO por aluno" (checagem + índice único parcial → 409).
     */
    @Transactional
    public TrainerLinkDTO assignStudentToTrainer(UUID companyId, UUID trainerId, UUID studentId) {
        User trainer = userRepository.findById(trainerId)
                .orElseThrow(() -> new EntityNotFoundException("Personal não encontrado."));
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new EntityNotFoundException("Aluno não encontrado."));

        if (trainer.getRole() != Role.PERSONAL) {
            throw new IllegalArgumentException("O funcionário informado não é um personal.");
        }
        if (student.getRole() != Role.ALUNO) {
            throw new IllegalArgumentException("O e-mail informado não pertence a um aluno.");
        }
        if (!companyId.equals(trainer.getCompanyId())) {
            throw new IllegalArgumentException("Este personal não pertence à sua empresa.");
        }
        if (trainerClientRepository.existsByStudentIdAndStatus(student.getId(), TrainerLinkStatus.ATIVO)) {
            throw new ActiveTrainerConflictException("Este aluno já possui um personal ativo.");
        }

        TrainerClient link = new TrainerClient();
        link.setTrainer(trainer);
        link.setStudent(student);
        link.setStatus(TrainerLinkStatus.ATIVO);
        link.setSource(TrainerLinkSource.COMPANY);
        link.setCompanyId(companyId);
        link.setRespondedAt(LocalDateTime.now());

        try {
            return toDto(trainerClientRepository.saveAndFlush(link), student);
        } catch (DataIntegrityViolationException e) {
            // Corrida: o índice único parcial barrou um segundo vínculo ATIVO.
            throw new ActiveTrainerConflictException("Este aluno já possui um personal ativo.");
        }
    }

    /**
     * O personal encerra o vínculo com um aluno da carteira (ex.: o aluno
     * cancelou o serviço). O personal perde o acesso aos dados do aluno, e as
     * fichas montadas por ele voltam a ser editáveis pelo aluno (ver
     * WorkoutService). Vínculo atribuído pela empresa só a empresa encerra.
     */
    @Transactional
    public void endLinkByTrainer(String trainerEmail, @NonNull UUID studentId) {
        User trainer = userRepository.getByEmailOrThrow(trainerEmail);
        TrainerClient link = trainerClientRepository
                .findByTrainerIdAndStudentIdAndStatus(trainer.getId(), studentId, TrainerLinkStatus.ATIVO)
                // 404 (e não 403) para não revelar a existência do aluno.
                .orElseThrow(() -> new EntityNotFoundException("Aluno não encontrado."));
        if (link.getSource() == TrainerLinkSource.COMPANY) {
            throw new IllegalArgumentException(
                    "Este aluno foi atribuído pela sua empresa. Peça à empresa para desvinculá-lo.");
        }
        link.setStatus(TrainerLinkStatus.ENCERRADO);
        link.setEndedAt(LocalDateTime.now());
        trainerClientRepository.save(link);
    }

    /**
     * O aluno encerra o vínculo com o próprio personal (botão "Encerrar vínculo"
     * do app). Mesmo efeito de {@link #endLinkByTrainer}; vínculo atribuído pela
     * empresa só a empresa encerra.
     */
    @Transactional
    public void endLinkByStudent(String studentEmail) {
        User student = userRepository.getByEmailOrThrow(studentEmail);
        TrainerClient link = trainerClientRepository
                .findByStudentIdAndStatus(student.getId(), TrainerLinkStatus.ATIVO)
                .orElseThrow(() -> new EntityNotFoundException("Você não possui personal ativo."));
        if (link.getSource() == TrainerLinkSource.COMPANY) {
            throw new IllegalArgumentException(
                    "Este personal foi atribuído pela sua academia. Peça à academia para encerrar o vínculo.");
        }
        link.setStatus(TrainerLinkStatus.ENCERRADO);
        link.setEndedAt(LocalDateTime.now());
        trainerClientRepository.save(link);
        // O interceptor de escrita do aluno não acha mais o vínculo ATIVO: avisa o ex-personal aqui.
        trainerEventService.publishAfterCommit(link.getTrainer().getId(), "students", student.getId());
    }

    /** Encerra um vínculo corporativo da empresa (desvincular aluno). */
    @Transactional
    public void endCompanyLink(UUID companyId, @NonNull UUID linkId) {
        TrainerClient link = trainerClientRepository.findById(linkId)
                .orElseThrow(() -> new EntityNotFoundException("Vínculo não encontrado."));
        if (!companyId.equals(link.getCompanyId())) {
            // 404 (e não 403) para não revelar vínculos de outra empresa.
            throw new EntityNotFoundException("Vínculo não encontrado.");
        }
        link.setStatus(TrainerLinkStatus.ENCERRADO);
        link.setRespondedAt(LocalDateTime.now());
        link.setEndedAt(LocalDateTime.now());
        trainerClientRepository.save(link);
        trainerEventService.publishAfterCommit(link.getTrainer().getId(), "students", link.getStudent().getId());
    }

    /** Busca o convite garantindo posse (é do aluno logado) e estado PENDENTE. */
    private TrainerClient getOwnedPendingInvite(User student, @NonNull UUID inviteId) {
        TrainerClient link = trainerClientRepository.findById(inviteId)
                .orElseThrow(() -> new EntityNotFoundException("Convite não encontrado."));
        if (!link.getStudent().getId().equals(student.getId())) {
            // 404 (e não 403) para não revelar a existência de convites alheios.
            throw new EntityNotFoundException("Convite não encontrado.");
        }
        if (link.getStatus() != TrainerLinkStatus.PENDENTE) {
            throw new IllegalArgumentException("Este convite já foi respondido.");
        }
        return link;
    }

    TrainerLinkDTO toDto(TrainerClient link, User peer) {
        return toDto(link, peer, false);
    }

    private TrainerLinkDTO toDto(TrainerClient link, User peer, boolean frozen) {
        // Celular só circula entre quem já tem vínculo ativo — convite pendente não expõe.
        String phone = link.getStatus() == TrainerLinkStatus.ATIVO ? peer.getPhone() : null;
        return new TrainerLinkDTO(
                link.getId(),
                new TrainerLinkDTO.PeerDTO(peer.getId(), peer.getNome(), peer.getEmail(), peer.getAvatarUrl(), phone),
                link.getStatus().name(),
                link.getSource().name(),
                link.getCreatedAt(),
                link.getRespondedAt(),
                frozen
        );
    }
}
