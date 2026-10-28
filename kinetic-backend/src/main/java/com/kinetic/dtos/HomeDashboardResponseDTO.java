package com.kinetic.dtos;

import java.util.List;

/**
 * Dados da Home. {@code monthSessions}: treinos no mês corrente; {@code volume7dKg}: volume
 * (reps × carga) dos últimos 7 dias, hoje incluso; {@code week}: domingo a sábado da semana atual.
 */
public record HomeDashboardResponseDTO(
        boolean workoutOnboardingCompleted,
        String userFirstName,
        int streakDays,
        int completedSessions,
        int targetSessions,
        int efficiencyPercentage,
        NextWorkoutResponseDTO nextWorkout,
        List<RankingEntryDTO> ranking,
        long monthSessions,
        double volume7dKg,
        List<HomeWeekDayDTO> week
) {}
