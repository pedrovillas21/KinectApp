package com.kinetic.services;

import com.kinetic.dtos.AlertPauseRequestDTO;
import com.kinetic.dtos.StudentEngagementDTO;
import com.kinetic.enums.AlertPauseReason;
import com.kinetic.enums.TrainerLinkStatus;
import com.kinetic.models.TrainerClient;
import com.kinetic.models.User;
import com.kinetic.repositories.TrainerClientRepository;
import com.kinetic.repositories.UserRepository;
import com.kinetic.repositories.WorkoutSessionRepository;
import com.kinetic.utils.AppTime;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/** Pausa dos alertas de risco: vale até o fim do último dia e some depois. */
class TrainerEngagementPauseTest {

    private final TrainerClientRepository links = mock(TrainerClientRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final TrainerEngagementService service =
            new TrainerEngagementService(links, mock(WorkoutSessionRepository.class), users);

    @Test
    void pauseCountsTodayAndExpiresAfterLastDay() {
        User trainer = new User();
        trainer.setId(UUID.randomUUID());
        trainer.setEmail("personal@test.local");
        UUID studentId = UUID.randomUUID();
        TrainerClient link = new TrainerClient();
        when(users.getByEmailOrThrow(trainer.getEmail())).thenReturn(trainer);
        when(links.findByTrainerIdAndStudentIdAndStatus(trainer.getId(), studentId, TrainerLinkStatus.ATIVO))
                .thenReturn(Optional.of(link));
        when(links.getActiveLink(trainer.getId(), studentId)).thenCallRealMethod();

        AlertPauseRequestDTO request = new AlertPauseRequestDTO();
        request.setReason(AlertPauseReason.LESAO);
        request.setDays(7);
        request.setNote("  Torceu o tornozelo  ");
        StudentEngagementDTO.Pause pause = service.pauseAlerts(trainer.getEmail(), studentId, request);

        LocalDate lastDay = AppTime.today().plusDays(6);
        assertEquals(lastDay, pause.until());
        assertEquals("Torceu o tornozelo", pause.note());
        assertNotNull(TrainerEngagementService.pauseOf(link, lastDay));
        assertNull(TrainerEngagementService.pauseOf(link, lastDay.plusDays(1)));
    }
}
