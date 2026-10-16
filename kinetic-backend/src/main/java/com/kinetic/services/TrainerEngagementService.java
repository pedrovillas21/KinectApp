package com.kinetic.services;

import com.kinetic.dtos.StudentEngagementDTO;
import com.kinetic.enums.TrainerLinkStatus;
import com.kinetic.models.TrainerClient;
import com.kinetic.models.User;
import com.kinetic.repositories.TrainerClientRepository;
import com.kinetic.repositories.UserRepository;
import com.kinetic.repositories.WorkoutSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Painel de aderência do personal: engajamento e alerta de risco de abandono de
 * toda a carteira em duas consultas agregadas (não uma por aluno).
 * As regras ficam em {@link StudentRiskRules}.
 */
@Service
@RequiredArgsConstructor
public class TrainerEngagementService {

    /** Quantos dias de histórico as regras olham (janela de 28 dias). */
    private static final int HISTORY_DAYS = 28;

    private final TrainerClientRepository trainerClientRepository;
    private final WorkoutSessionRepository workoutSessionRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<StudentEngagementDTO> engagement(String trainerEmail) {
        User trainer = userRepository.getByEmailOrThrow(trainerEmail);
        List<TrainerClient> links = trainerClientRepository
                .findByTrainerAndStatusFetchStudent(trainer.getId(), TrainerLinkStatus.ATIVO);
        if (links.isEmpty()) {
            return List.of();
        }

        List<UUID> ids = links.stream().map(l -> l.getStudent().getId()).toList();
        LocalDate today = LocalDate.now();

        Map<UUID, LocalDate> lastSession = new HashMap<>();
        for (Object[] row : workoutSessionRepository.findLastSessionDatePerUser(ids)) {
            lastSession.put((UUID) row[0], (LocalDate) row[1]);
        }
        Map<UUID, Set<LocalDate>> recentDays = new HashMap<>();
        for (Object[] row : workoutSessionRepository.findSessionDaysForUsersSince(
                ids, today.minusDays(HISTORY_DAYS - 1L))) {
            recentDays.computeIfAbsent((UUID) row[0], k -> new HashSet<>()).add((LocalDate) row[1]);
        }

        return links.stream()
                .map(link -> {
                    User student = link.getStudent();
                    LocalDateTime since = link.getRespondedAt() != null ? link.getRespondedAt() : link.getCreatedAt();
                    return StudentRiskRules.evaluate(
                            student.getId(),
                            recentDays.getOrDefault(student.getId(), Set.of()),
                            lastSession.get(student.getId()),
                            since != null ? since.toLocalDate() : today,
                            student.getFrequency(),
                            today);
                })
                .toList();
    }
}
