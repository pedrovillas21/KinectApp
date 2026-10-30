package com.kinetic.dtos;

import java.time.LocalDate;

/**
 * Conquista calculada a partir do histórico (sem tabela própria). {@code progress}/{@code target}
 * permitem barra de progresso; {@code unlockedAt} é nulo enquanto não desbloqueada.
 */
public record AchievementDTO(
        String code,
        String title,
        String description,
        boolean unlocked,
        LocalDate unlockedAt,
        long progress,
        long target
) {}
