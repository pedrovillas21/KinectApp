package com.kinetic.services;

import com.kinetic.dtos.GenerateWorkoutRequestDto;
import com.kinetic.exceptions.AiQuotaExceededException;
import com.kinetic.models.User;
import com.kinetic.repositories.TrainerClientRepository;
import com.kinetic.repositories.UserRepository;
import com.kinetic.repositories.WorkoutExecutionLogRepository;
import com.kinetic.repositories.WorkoutPlanRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Cota de IA do aluno sem personal: 1ª ficha livre, depois uma a cada 30 dias. */
class WorkoutServiceAiQuotaTest {

    private final GeminiService gemini = mock(GeminiService.class);
    private final WorkoutPlanRepository plans = mock(WorkoutPlanRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final WorkoutService service = new WorkoutService(gemini, plans, users,
            mock(PlanCycleSnapshotService.class), mock(WorkoutExecutionLogRepository.class),
            mock(TrainerClientRepository.class), new TransactionTemplate(mock(PlatformTransactionManager.class)));

    private final User student = new User();
    private final GenerateWorkoutRequestDto request = new GenerateWorkoutRequestDto(
            LocalDate.of(1995, 5, 10), 80.0, 180.0, "hipertrofia", 4, "intermediario", null);

    @BeforeEach
    void setUp() {
        student.setId(UUID.randomUUID());
        student.setEmail("aluno@test.local");
        when(users.getByEmailOrThrow(student.getEmail())).thenReturn(student);
        // Gemini vazio encerra a geração logo após a cota: basta saber se ele foi chamado.
        when(gemini.generateWorkoutPlan(any(), anyInt(), anyDouble(), anyDouble(), any(), anyInt(), any()))
                .thenReturn(List.of());
    }

    @Test
    void firstPlanIsAlwaysAllowed() {
        when(plans.findLatestAiCreatedAt(student.getId())).thenReturn(Optional.empty());

        assertThrows(IllegalStateException.class, () -> service.generateWorkoutForUser(student.getEmail(), request));
        verify(gemini).generateWorkoutPlan(any(), anyInt(), anyDouble(), anyDouble(), any(), anyInt(), any());
    }

    @Test
    void secondPlanWithinThirtyDaysIsBlockedBeforeCallingTheAi() {
        when(plans.findLatestAiCreatedAt(student.getId()))
                .thenReturn(Optional.of(LocalDateTime.now().minusDays(29)));

        assertThrows(AiQuotaExceededException.class, () -> service.generateWorkoutForUser(student.getEmail(), request));
        verify(gemini, never()).generateWorkoutPlan(any(), anyInt(), anyDouble(), anyDouble(), any(), anyInt(), any());
    }

    @Test
    void newPlanIsAllowedAfterThirtyDays() {
        when(plans.findLatestAiCreatedAt(student.getId()))
                .thenReturn(Optional.of(LocalDateTime.now().minusDays(30).minusMinutes(1)));

        assertThrows(IllegalStateException.class, () -> service.generateWorkoutForUser(student.getEmail(), request));
        verify(gemini).generateWorkoutPlan(any(), anyInt(), anyDouble(), anyDouble(), any(), anyInt(), any());
    }

    @Test
    void failedAttemptsAreCappedPerHourEvenWithoutASavedPlan() {
        when(plans.findLatestAiCreatedAt(student.getId())).thenReturn(Optional.empty());

        for (int i = 0; i < WorkoutService.MAX_AI_ATTEMPTS_PER_HOUR; i++) {
            assertThrows(IllegalStateException.class, () -> service.generateWorkoutForUser(student.getEmail(), request));
        }
        assertThrows(AiQuotaExceededException.class, () -> service.generateWorkoutForUser(student.getEmail(), request));
        verify(gemini, times(WorkoutService.MAX_AI_ATTEMPTS_PER_HOUR))
                .generateWorkoutPlan(any(), anyInt(), anyDouble(), anyDouble(), any(), anyInt(), any());
    }
}
