package com.kinetic.dtos;

import java.util.List;

public record HomeDashboardResponseDTO(
        boolean workoutOnboardingCompleted,
        String userFirstName,
        int streakDays,
        int completedSessions,
        int targetSessions,
        int efficiencyPercentage,
        NextWorkoutResponseDTO nextWorkout,
        List<RankingEntryDTO> ranking,
        List<WeeklyActivityPointDTO> weeklyActivity
) {}
