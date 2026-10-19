package com.kinetic.dtos;

/**
 * Indicadores de treino da aba Progresso: tempo treinado no período (e no anterior, para a
 * variação), recordes batidos no período e sequência de dias com treino.
 */
public record StatsTrainingDTO(
        int minutes,
        int previousMinutes,
        int recordsCount,
        /** Recorde mais recente do período; nulo quando não houve nenhum. */
        PersonalRecordDTO latestRecord,
        int streakDays,
        int bestStreakDays
) {}
