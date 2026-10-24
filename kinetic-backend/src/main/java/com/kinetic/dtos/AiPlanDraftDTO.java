package com.kinetic.dtos;

import java.util.List;

/**
 * Fichas montadas pela IA a pedido do personal, antes da aprovação. É o formato que o
 * Gemini devolve (após normalização) e o que fica salvo em ai_plan_generations.ai_output.
 */
public record AiPlanDraftDTO(
        // Como a IA interpretou o pedido: o personal confere se bate com o que pediu.
        List<Note> understood,
        // O que o personal deve conferir antes de aprovar (restrições, cargas estimadas...).
        List<Note> attentionPoints,
        List<Plan> plans
) {
    public record Note(String title, String detail) {}

    public record Plan(
            String title,
            String subtitle,
            Integer estimatedDurationMinutes,
            List<Exercise> exercises
    ) {}

    public record Exercise(
            String name,
            String muscles,
            String type,
            Integer sets,
            String reps,
            String weight,
            String restTime,
            String section,
            String notes,
            // Motivo para o personal conferir este exercício; null quando não há.
            String attention
    ) {}
}
