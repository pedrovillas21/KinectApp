package com.kinetic.services;

import com.kinetic.dtos.AchievementDTO;
import com.kinetic.dtos.PersonalRecordDTO;
import com.kinetic.dtos.WorkoutSummaryDTO;
import com.kinetic.models.Exercise;
import com.kinetic.models.ExerciseSetLog;
import com.kinetic.models.User;
import com.kinetic.models.WorkoutPlan;
import com.kinetic.models.WorkoutSession;
import com.kinetic.repositories.ExerciseSetLogRepository;
import com.kinetic.repositories.WorkoutSessionRepository;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class TrainingSummaryServiceTest {

    private static final UUID USER = UUID.randomUUID();

    private final WorkoutSessionRepository sessions = mock(WorkoutSessionRepository.class);
    private final ExerciseSetLogRepository setLogs = mock(ExerciseSetLogRepository.class);
    private final TrainingSummaryService service = new TrainingSummaryService(sessions, setLogs);

    @Test
    void normalizesExerciseNames() {
        assertEquals("supino reto", TrainingSummaryService.normalizeExerciseName("  Supíno   RETO "));
        assertEquals("elevacao lateral", TrainingSummaryService.normalizeExerciseName("Elevação Lateral"));
        assertEquals("", TrainingSummaryService.normalizeExerciseName(null));
    }

    @Test
    void personalRecordsMergeNameVariantsAndKeepHeaviestSet() {
        LocalDate d1 = LocalDate.of(2026, 9, 1);
        LocalDate d2 = LocalDate.of(2026, 9, 8);
        when(setLogs.findDistinctSetsForUser(USER)).thenReturn(List.of(
                new Object[]{"Supino Reto", 60.0, 10, d1},
                new Object[]{"supino  reto", 70.0, 6, d2},
                new Object[]{"Supíno reto", 70.0, 5, d1},
                new Object[]{"Agachamento", 100.0, 5, d1}
        ));

        List<PersonalRecordDTO> prs = service.personalRecords(USER);

        assertEquals(2, prs.size());
        assertEquals("Agachamento", prs.get(0).exercise());
        PersonalRecordDTO bench = prs.get(1);
        assertEquals(70.0, bench.weightKg());
        assertEquals(6, bench.reps());
        assertEquals(d2, bench.date());
    }

    @Test
    void achievementsUnlockByCountStreakAndVolume() {
        LocalDate start = LocalDate.of(2026, 1, 1);
        List<LocalDate> dates = new ArrayList<>();
        for (int i = 0; i < 10; i++) dates.add(start.plusDays(i)); // 10 dias seguidos
        when(sessions.findAllSessionDatesByUserId(USER)).thenReturn(dates);
        List<Object[]> volume = new ArrayList<>();
        volume.add(new Object[]{start, 6_000.0});
        volume.add(new Object[]{start.plusDays(1), 5_000.0});
        when(setLogs.sumVolumePerDayForUser(USER)).thenReturn(volume);

        Map<String, AchievementDTO> byCode = new java.util.HashMap<>();
        service.achievements(USER).forEach(a -> byCode.put(a.code(), a));

        assertTrue(byCode.get("FIRST_WORKOUT").unlocked());
        assertEquals(start, byCode.get("FIRST_WORKOUT").unlockedAt());
        assertTrue(byCode.get("WORKOUTS_10").unlocked());
        assertEquals(start.plusDays(9), byCode.get("WORKOUTS_10").unlockedAt());
        assertFalse(byCode.get("WORKOUTS_50").unlocked());
        assertEquals(10, byCode.get("WORKOUTS_50").progress());
        assertTrue(byCode.get("STREAK_7").unlocked());
        assertEquals(start.plusDays(6), byCode.get("STREAK_7").unlockedAt());
        assertFalse(byCode.get("STREAK_30").unlocked());
        assertTrue(byCode.get("VOLUME_10T").unlocked());
        assertEquals(start.plusDays(1), byCode.get("VOLUME_10T").unlockedAt());
        assertNull(byCode.get("VOLUME_100T").unlockedAt());
    }

    @Test
    void summarizeBuildsCardWithTopThreeExercisesAndRecords() {
        User user = new User();
        user.setId(USER);
        WorkoutPlan plan = new WorkoutPlan();
        plan.setTitle("Treino A");
        WorkoutSession session = new WorkoutSession();
        session.setId(UUID.randomUUID());
        session.setUser(user);
        session.setSessionDate(LocalDate.of(2026, 10, 10));
        session.setDurationInSeconds(3600);

        List<ExerciseSetLog> logs = new ArrayList<>();
        String[] names = {"Supino", "Remada", "Agachamento", "Rosca"};
        for (int i = 0; i < names.length; i++) {
            Exercise ex = new Exercise();
            ex.setName(names[i]);
            ex.setSortOrder(i);
            ex.setWorkoutPlan(plan);
            logs.add(log(session, ex, 1, 10, 50.0));
            logs.add(log(session, ex, 2, 8, 60.0));
        }
        when(setLogs.findWithExerciseBySessionIds(anyCollection())).thenReturn(logs);
        // Antes deste treino: supino máx. 55 (bateu recorde), remada máx. 70 (não bateu);
        // agachamento e rosca nunca feitos (primeira vez não conta como recorde).
        when(setLogs.maxWeightPerExerciseBefore(eq(USER), any())).thenReturn(List.of(
                new Object[]{"supino", 55.0},
                new Object[]{"Remada", 70.0}
        ));

        WorkoutSummaryDTO card = service.summarize(List.of(session)).get(session.getId());

        assertEquals("Treino A", card.title());
        assertEquals(3600, card.durationSeconds());
        assertEquals(4 * (10 * 50.0 + 8 * 60.0), card.volumeKg());
        assertEquals(1, card.recordsCount());
        assertEquals(3, card.exercises().size());
        assertEquals(1, card.moreExercises());
        assertEquals("Supino", card.exercises().get(0).name());
        assertEquals(2, card.exercises().get(0).setsCount());
        assertEquals(60.0, card.exercises().get(0).bestSet().weightKg());
        assertEquals(8, card.exercises().get(0).bestSet().reps());
    }

    private static ExerciseSetLog log(WorkoutSession s, Exercise ex, int setNumber, int reps, double weight) {
        ExerciseSetLog sl = new ExerciseSetLog();
        sl.setWorkoutSession(s);
        sl.setExercise(ex);
        sl.setSetNumber(setNumber);
        sl.setRepsPerformed(reps);
        sl.setWeightUsed(weight);
        return sl;
    }

    @Test
    void longestRunCountsConsecutiveDistinctDays() {
        LocalDate d = LocalDate.of(2026, 10, 1);
        assertEquals(0, TrainingSummaryService.longestRun(List.of()));
        assertEquals(3, TrainingSummaryService.longestRun(
                List.of(d, d.plusDays(1), d.plusDays(1), d.plusDays(2), d.plusDays(5), d.plusDays(6))));
    }

    @Test
    void recordsBetweenNeedAPreviousLighterBest() {
        LocalDate start = LocalDate.of(2026, 10, 1);
        LocalDate end = LocalDate.of(2026, 10, 19);
        when(setLogs.maxWeightPerExerciseBefore(USER, start)).thenReturn(List.<Object[]>of(
                new Object[]{"Supino Reto", 22.0},
                new Object[]{"Remada", 60.0}
        ));
        when(setLogs.findDistinctSetsForUser(USER)).thenReturn(List.of(
                new Object[]{"supino reto", 26.0, 9, LocalDate.of(2026, 10, 10)},   // superou 22 → recorde
                new Object[]{"Remada", 55.0, 8, LocalDate.of(2026, 10, 12)},        // abaixo de 60 → não
                new Object[]{"Agachamento", 85.0, 8, LocalDate.of(2026, 10, 15)},   // primeira vez → não
                new Object[]{"Remada", 60.0, 10, LocalDate.of(2026, 9, 1)}
        ));

        List<PersonalRecordDTO> records = service.recordsBetween(USER, start, end);

        assertEquals(1, records.size());
        assertEquals("supino reto", records.get(0).exercise());
        assertEquals(26.0, records.get(0).weightKg());
    }
}
