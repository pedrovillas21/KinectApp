package com.kinetic.dtos;

import java.util.List;

/**
 * KPIs macro do painel ROOT — tudo real e barato (count queries + agregação
 * simples de crescimento). Faturamento/auditoria ficam de fora (placeholder).
 */
public record RootMetricsDTO(
        long totalCompanies,
        long totalPersonais,
        long totalAlunos,
        long newUsersInPeriod,
        /** Série de crescimento (contas novas por dia) no período selecionado. */
        List<GrowthPoint> growth
) {
    /** Um ponto da série de crescimento: data ISO (YYYY-MM-DD) e nº de contas. */
    public record GrowthPoint(String date, long count) {
    }
}
