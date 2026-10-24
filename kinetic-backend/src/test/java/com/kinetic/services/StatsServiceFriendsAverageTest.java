package com.kinetic.services;

import com.kinetic.enums.StatsPeriodParam;
import org.junit.jupiter.api.Test;

import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class StatsServiceFriendsAverageTest {

    private static final UUID A = UUID.randomUUID();
    private static final UUID B = UUID.randomUUID();
    private static final UUID C = UUID.randomUUID();

    @Test
    void noFriendsHasNoAverage() {
        assertNull(StatsService.friendsAverage(Map.of(), Map.of(), StatsPeriodParam.MONTH));
    }

    @Test
    void singleFriendHasNoAverageSoTheirAdherenceIsNotExposed() {
        assertNull(StatsService.friendsAverage(Map.of(A, 3), Map.of(A, 12L), StatsPeriodParam.MONTH));
    }

    @Test
    void averagesFriendsUsingTheSelectedPeriodTarget() {
        // Mês: alvo = frequência * 4. A: 6/12 = 50%; B: 8/8 = 100%.
        assertEquals(75, StatsService.friendsAverage(
                Map.of(A, 3, B, 2), Map.of(A, 6L, B, 8L), StatsPeriodParam.MONTH));
        // Semana: alvo = frequência. A: 2/3 = 67%; B sem sessões = 0%.
        assertEquals(34, StatsService.friendsAverage(
                Map.of(A, 3, B, 2), Map.of(A, 2L), StatsPeriodParam.WEEK));
    }

    @Test
    void friendAboveTargetIsCappedAt100() {
        // A: 10/3 → 100%; B: 0/3 → 0%.
        assertEquals(50, StatsService.friendsAverage(
                Map.of(A, 3, B, 3), Map.of(A, 10L), StatsPeriodParam.WEEK));
    }

    @Test
    void friendsWithoutFrequencyDoNotCount() {
        assertNull(StatsService.friendsAverage(Map.of(A, 3, C, 0), Map.of(A, 3L), StatsPeriodParam.WEEK));
    }
}
