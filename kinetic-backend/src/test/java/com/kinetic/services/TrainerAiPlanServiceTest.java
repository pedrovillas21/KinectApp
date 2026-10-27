package com.kinetic.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kinetic.dtos.TrainerAiPlanRequestDTO;
import com.kinetic.exceptions.AiQuotaExceededException;
import com.kinetic.models.User;
import com.kinetic.repositories.AiPlanGenerationRepository;
import com.kinetic.repositories.UserRepository;
import com.kinetic.repositories.WorkoutPlanRepository;
import net.javacrumbs.shedlock.core.LockProvider;
import net.javacrumbs.shedlock.core.SimpleLock;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/** Uma geração de IA por vez por personal; a trava sai mesmo quando a IA falha. */
class TrainerAiPlanServiceTest {

    private final TrainerLinkService links = mock(TrainerLinkService.class);
    private final BillingService billing = mock(BillingService.class);
    private final GeminiService gemini = mock(GeminiService.class);
    private final UserRepository users = mock(UserRepository.class);
    private final LockProvider lockProvider = mock(LockProvider.class);
    private final TrainerAiPlanService service = new TrainerAiPlanService(links, mock(TrainerPlanService.class),
            billing, gemini, mock(PlanCycleSnapshotService.class), mock(AiPlanGenerationRepository.class),
            mock(WorkoutPlanRepository.class), users, new ObjectMapper(), lockProvider);

    private final User trainer = new User();
    private final UUID studentId = UUID.randomUUID();
    private final TrainerAiPlanRequestDTO request = new TrainerAiPlanRequestDTO("Treino de força 3x por semana", 1, 60, null);

    @BeforeEach
    void setUp() {
        trainer.setId(UUID.randomUUID());
        trainer.setEmail("personal@teste");
        User student = new User();
        student.setId(studentId);
        when(links.resolveOwnedStudentForWrite("personal@teste", studentId)).thenReturn(student);
        when(users.getByEmailOrThrow("personal@teste")).thenReturn(trainer);
    }

    @Test
    void secondGenerationWhileOneIsRunningIsRefused() {
        when(lockProvider.lock(any())).thenReturn(Optional.empty());

        assertThrows(AiQuotaExceededException.class, () -> service.generatePreview("personal@teste", studentId, request));
        verifyNoInteractions(billing, gemini);
    }

    @Test
    void lockIsReleasedWhenTheAiFails() {
        SimpleLock lock = mock(SimpleLock.class);
        when(lockProvider.lock(any())).thenReturn(Optional.of(lock));
        when(gemini.generateJson(anyString(), any())).thenThrow(new IllegalStateException("IA fora do ar"));

        assertThrows(IllegalStateException.class, () -> service.generatePreview("personal@teste", studentId, request));
        verify(lock).unlock();
    }
}
