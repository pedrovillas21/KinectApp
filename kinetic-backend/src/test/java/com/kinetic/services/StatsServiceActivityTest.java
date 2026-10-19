package com.kinetic.services;

import com.kinetic.dtos.StatsActivityDTO;
import com.kinetic.enums.StatsPeriodParam;
import com.kinetic.models.WorkoutSession;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class StatsServiceActivityTest {

    @Test
    void monthBucketsAreSundayWeeksClampedToThePeriod() {
        LocalDate start = LocalDate.of(2026, 10, 1);   // quinta
        LocalDate end = LocalDate.of(2026, 10, 19);    // segunda
        List<WorkoutSession> sessions = List.of(
                session(LocalDate.of(2026, 9, 30), 3600),  // fora do período
                session(LocalDate.of(2026, 10, 2), 3000),
                session(LocalDate.of(2026, 10, 6), 1800),
                session(LocalDate.of(2026, 10, 8), 1800),
                session(LocalDate.of(2026, 10, 19), 600)
        );

        StatsActivityDTO a = StatsService.buildActivity(StatsPeriodParam.MONTH, 5, start, end, sessions);

        assertEquals("week", a.granularity());
        assertEquals(5, a.target());
        assertEquals(List.of(LocalDate.of(2026, 9, 27), LocalDate.of(2026, 10, 4),
                        LocalDate.of(2026, 10, 11), LocalDate.of(2026, 10, 18)),
                a.buckets().stream().map(b -> b.start()).toList());
        assertEquals(List.of(1, 2, 0, 1), a.buckets().stream().map(b -> b.sessions()).toList());
        assertEquals(List.of(50, 60, 0, 10), a.buckets().stream().map(b -> b.minutes()).toList());
    }

    @Test
    void weekHasSevenDaysAndNoTarget() {
        LocalDate monday = LocalDate.of(2026, 10, 19);
        StatsActivityDTO a = StatsService.buildActivity(StatsPeriodParam.WEEK, 5, monday, monday,
                List.of(session(monday, 900)));

        assertEquals("day", a.granularity());
        assertNull(a.target());
        assertEquals(7, a.buckets().size());
        assertEquals(1, a.buckets().get(0).sessions());
        assertEquals(0, a.buckets().get(6).sessions());
    }

    @Test
    void yearHasTwelveMonths() {
        LocalDate end = LocalDate.of(2026, 10, 19);
        StatsActivityDTO a = StatsService.buildActivity(StatsPeriodParam.YEAR, 3, end.minusDays(364), end,
                List.of(session(LocalDate.of(2026, 10, 5), 600), session(LocalDate.of(2025, 11, 3), 600)));

        assertEquals("month", a.granularity());
        assertEquals(13, a.target());
        assertEquals(LocalDate.of(2025, 11, 1), a.buckets().get(0).start());
        assertEquals(1, a.buckets().get(0).sessions());
        assertEquals(1, a.buckets().get(11).sessions());
    }

    private static WorkoutSession session(LocalDate date, int seconds) {
        WorkoutSession s = new WorkoutSession();
        s.setSessionDate(date);
        s.setDurationInSeconds(seconds);
        return s;
    }
}
