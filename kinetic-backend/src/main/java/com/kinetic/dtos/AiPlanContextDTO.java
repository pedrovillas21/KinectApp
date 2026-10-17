package com.kinetic.dtos;

/**
 * Dados do aluno que a IA considera ao montar fichas a pedido do personal (vêm da
 * anamnese feita no app). Campos null = o aluno não informou.
 */
public record AiPlanContextDTO(
        String goal,
        String level,
        Integer age,
        Double weightKg,
        Double heightCm,
        Integer frequency,
        String medicalConditions,
        int activePlanCount
) {}
