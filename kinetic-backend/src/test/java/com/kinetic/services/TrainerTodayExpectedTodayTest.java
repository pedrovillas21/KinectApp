package com.kinetic.services;

import com.kinetic.dtos.StudentEngagementDTO;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** "Ainda não treinou hoje": intervalo normal pela meta, sem duplicar o painel de risco. */
class TrainerTodayExpectedTodayTest {

    private static StudentEngagementDTO e(Integer target, Integer daysSince, String risk,
                                          StudentEngagementDTO.Pause pause) {
        return new StudentEngagementDTO(UUID.randomUUID(), null, daysSince, target, null, 28, 0, risk, List.of(),
                pause);
    }

    @Test
    void followsTheNormalIntervalForTheWeeklyTarget() {
        assertFalse(TrainerTodayService.expectedToday(e(5, 1, "OK", null)));
        assertTrue(TrainerTodayService.expectedToday(e(5, 2, "OK", null)));
        assertFalse(TrainerTodayService.expectedToday(e(3, 2, "OK", null)));
        assertTrue(TrainerTodayService.expectedToday(e(3, 3, "MEDIO", null)));
    }

    @Test
    void leavesOutTrainedTodayNoTargetPausedAndHighRisk() {
        assertFalse(TrainerTodayService.expectedToday(e(5, 0, "OK", null)));
        assertFalse(TrainerTodayService.expectedToday(e(null, 5, "OK", null)));
        assertFalse(TrainerTodayService.expectedToday(e(5, null, "MEDIO", null)));
        assertFalse(TrainerTodayService.expectedToday(e(5, 12, "ALTO", null)));
        assertFalse(TrainerTodayService.expectedToday(e(5, 3, "OK",
                new StudentEngagementDTO.Pause(LocalDate.now(), "LESAO", null, null))));
    }
}
