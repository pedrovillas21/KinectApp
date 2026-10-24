package com.kinetic.dtos;

import java.util.List;
import java.util.UUID;

/**
 * Analytics da unidade (EMPRESA): retenção, volume de treinos e desempenho por
 * instrutor. Tudo real e barato — count queries + agregação sobre sessões.
 */
public record EmpresaAnalyticsDTO(
        long personaisAtivos,
        long alunosAtivos,
        long alunosVinculadosNoPeriodo,
        /** alunos com vínculo ATIVO / total vinculado no período (0..1). */
        double retentionRate,
        long sessoesNoPeriodo,
        List<VolumePoint> volumeSeries,
        List<InstructorPerf> desempenhoPorInstrutor
) {
    /** Sessões de treino da unidade num dia (série do gráfico de volume). */
    public record VolumePoint(String date, long sessions) {
    }

    /** Nº de alunos ativos sob um instrutor. */
    public record InstructorPerf(UUID trainerId, String trainerName, long activeStudents) {
    }
}
