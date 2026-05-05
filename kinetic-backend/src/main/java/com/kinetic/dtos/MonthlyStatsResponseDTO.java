package com.kinetic.dtos;

public record MonthlyStatsResponseDTO(
        long completedSessions,
        int targetSessions,
        int efficiency
) {
}
