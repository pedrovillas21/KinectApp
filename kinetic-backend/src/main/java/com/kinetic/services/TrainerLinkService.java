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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
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
public class TrainerLinkService {

    private final TrainerClientRepository trainerClientRepository;
    private final UserRepository userRepository;

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

        TrainerClient link = new TrainerClient();
        link.setTrainer(trainer);
        link.setStudent(student);
        link.setStatus(TrainerLinkStatus.PENDENTE);
        link.setSource(TrainerLinkSource.INVITE);

        try {
            return toDto(trainerClientRepository.saveAndFlush(link), student);
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
    public TrainerLinkDTO accept(String studentEmail, UUID inviteId) {
        User student = userRepository.getByEmailOrThrow(studentEmail);
        TrainerClient link = getOwnedPendingInvite(student, inviteId);

        if (trainerClientRepository.existsByStudentIdAndStatus(student.getId(), TrainerLinkStatus.ATIVO)) {
            throw new ActiveTrainerConflictException("Você já possui um personal ativo.");
        }

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
    public void decline(String studentEmail, UUID inviteId) {
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
        return trainerClientRepository
                .findByTrainerAndStatusFetchStudent(trainer.getId(), TrainerLinkStatus.ATIVO)
                .stream()
                .map(link -> toDto(link, link.getStudent()))
                .toList();
    }

    /** Busca o convite garantindo posse (é do aluno logado) e estado PENDENTE. */
    private TrainerClient getOwnedPendingInvite(User student, UUID inviteId) {
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

    private TrainerLinkDTO toDto(TrainerClient link, User peer) {
        return new TrainerLinkDTO(
                link.getId(),
                new TrainerLinkDTO.PeerDTO(peer.getId(), peer.getNome(), peer.getEmail(), peer.getAvatarUrl()),
                link.getStatus().name(),
                link.getSource().name(),
                link.getCreatedAt(),
                link.getRespondedAt()
        );
    }
}
