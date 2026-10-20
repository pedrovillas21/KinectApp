package com.kinetic.services;

import com.kinetic.dtos.StudentProtocolDTOs;
import com.kinetic.enums.TrainerLinkStatus;
import com.kinetic.models.TrainerClient;
import com.kinetic.models.User;
import com.kinetic.repositories.TrainerClientRepository;
import com.kinetic.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

/**
 * Protocolo (objetivo, nível, frequência) e anamnese do aluno. Sem personal, o aluno
 * define tudo no app (onboarding/regeneração). Com vínculo ativo, quem define é o
 * personal; o aluno só vê e confirma que a anamnese bate com o que contou na consulta.
 */
@Service
@RequiredArgsConstructor
public class StudentProtocolService {

    static final Set<String> GOALS = Set.of("Ganho de Massa", "Perda de Gordura", "Performance");

    private final TrainerLinkService trainerLinkService;
    private final TrainerClientRepository trainerClientRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public StudentProtocolDTOs.Response getForTrainer(String trainerEmail, @NonNull UUID studentId) {
        return toResponse(trainerLinkService.resolveOwnedStudent(trainerEmail, studentId));
    }

    @Transactional
    public StudentProtocolDTOs.Response updateByTrainer(String trainerEmail, @NonNull UUID studentId,
                                                        StudentProtocolDTOs.UpdateRequest request) {
        User student = trainerLinkService.resolveOwnedStudent(trainerEmail, studentId);
        User trainer = userRepository.getByEmailOrThrow(trainerEmail);

        String goal = request.goal().trim();
        if (!GOALS.contains(goal)) {
            throw new IllegalArgumentException("Objetivo inválido. Use Ganho de Massa, Perda de Gordura ou Performance.");
        }
        String level = TrainerPlanService.resolveLevel(request.level(), null, null);
        String anamnesis = request.medicalConditions() == null ? null : request.medicalConditions().trim();
        if (anamnesis != null && anamnesis.isEmpty()) anamnesis = null;

        LocalDateTime now = LocalDateTime.now();
        if (!goal.equals(student.getGoal()) || !level.equals(student.getLevel())
                || !request.frequency().equals(student.getFrequency())) {
            student.setGoal(goal);
            student.setLevel(level);
            student.setFrequency(request.frequency());
            student.setProtocolUpdatedAt(now);
            student.setProtocolUpdatedById(trainer.getId());
        }
        if (!Objects.equals(anamnesis, blankToNull(student.getMedicalConditions()))) {
            student.setMedicalConditions(anamnesis);
            student.setAnamnesisUpdatedAt(now);
            student.setAnamnesisUpdatedById(trainer.getId());
            // A conferência valia para o texto anterior: o aluno precisa ver a versão nova.
            student.setAnamnesisConfirmedAt(null);
        }
        return toResponse(userRepository.save(student));
    }

    @Transactional(readOnly = true)
    public StudentProtocolDTOs.Response getForStudent(String studentEmail) {
        return toResponse(userRepository.getByEmailOrThrow(studentEmail));
    }

    /** O aluno confere a anamnese registrada (pelo personal ou por ele mesmo). */
    @Transactional
    public StudentProtocolDTOs.Response confirmAnamnesis(String studentEmail) {
        User student = userRepository.getByEmailOrThrow(studentEmail);
        if (blankToNull(student.getMedicalConditions()) == null) {
            throw new IllegalArgumentException("Ainda não há anamnese registrada para conferir.");
        }
        student.setAnamnesisConfirmedAt(LocalDateTime.now());
        return toResponse(userRepository.save(student));
    }

    /** Registro feito pelo próprio aluno (onboarding/regeneração sem personal): ele já conferiu o que escreveu. */
    static void recordStudentEdit(User student, boolean anamnesisChanged) {
        LocalDateTime now = LocalDateTime.now();
        student.setProtocolUpdatedAt(now);
        student.setProtocolUpdatedById(student.getId());
        if (anamnesisChanged) {
            student.setAnamnesisUpdatedAt(now);
            student.setAnamnesisUpdatedById(student.getId());
            student.setAnamnesisConfirmedAt(now);
        }
    }

    private StudentProtocolDTOs.Response toResponse(User student) {
        String managedBy = trainerClientRepository
                .findByStudentIdAndStatus(student.getId(), TrainerLinkStatus.ATIVO)
                .map(TrainerClient::getTrainer)
                .map(User::getNome)
                .orElse(null);
        return new StudentProtocolDTOs.Response(
                blankToNull(student.getGoal()),
                blankToNull(student.getLevel()),
                student.getFrequency(),
                blankToNull(student.getMedicalConditions()),
                managedBy,
                student.getProtocolUpdatedAt(),
                nameOf(student.getProtocolUpdatedById()),
                student.getId().equals(student.getProtocolUpdatedById()),
                student.getAnamnesisUpdatedAt(),
                nameOf(student.getAnamnesisUpdatedById()),
                student.getId().equals(student.getAnamnesisUpdatedById()),
                student.getAnamnesisConfirmedAt());
    }

    private String nameOf(UUID userId) {
        return userId == null ? null : userRepository.findById(userId).map(User::getNome).orElse(null);
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
