package com.kinetic.dtos;

import java.util.List;

/**
 * Treinos do período quebrados em barras: dias (semana), semanas (mês e 3M) ou meses (ano).
 * {@code target} é a meta de treinos por barra (frequência semanal do usuário); nulo nas
 * barras diárias ou quando o usuário não tem frequência definida.
 */
public record StatsActivityDTO(
        String granularity,
        Integer target,
        List<ActivityBucketDTO> buckets
) {
    /** Uma barra: primeiro dia do intervalo, treinos e minutos treinados nele. */
    public record ActivityBucketDTO(java.time.LocalDate start, int sessions, int minutes) {}
}
