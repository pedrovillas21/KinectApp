package com.kinetic.dtos;

import java.time.LocalDate;

/**
 * Minutos totais treinados em um dia específico da semana corrente.
 * Consumido pelo BarChart do HomeScreen (FE).
 */
public record WeeklyActivityDayDTO(
        LocalDate date,
        int minutes
) {
}
