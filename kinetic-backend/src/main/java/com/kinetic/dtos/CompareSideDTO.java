package com.kinetic.dtos;

import java.util.List;
import java.util.UUID;

/** Um dos lados do "Comparar progresso" — só dados de treino (sem peso corporal). */
public record CompareSideDTO(
        UUID id,
        String name,
        String avatarUrl,
        List<Integer> weeklyMinutes,
        long monthSessions,
        int streakDays,
        long totalSessions,
        double volume30dKg
) {}
