package com.kinetic.dtos;

import com.kinetic.models.WorkoutPlan;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record WorkoutPlanResponseDTO(
        UUID id,
        String title,
        String subtitle,
        String tag,
        String level,
        Integer estimatedDurationMinutes,
        LocalDateTime lastCompletedAt,
        LocalDateTime createdAt,
        List<ExerciseResponseDTO> data
) {
    /**
     * Sobrecarga sem ultima execucao (ex.: logo apos a geracao). lastCompletedAt = null.
     */
    public static WorkoutPlanResponseDTO fromEntity(WorkoutPlan workoutPlan) {
        return fromEntity(workoutPlan, null);
    }

    public static WorkoutPlanResponseDTO fromEntity(WorkoutPlan workoutPlan, LocalDateTime lastCompletedAt) {
        List<ExerciseResponseDTO> exercises = workoutPlan.getExercises().stream()
                .map(ExerciseResponseDTO::fromEntity)
                .toList();

        return new WorkoutPlanResponseDTO(
                workoutPlan.getId(),
                workoutPlan.getTitle(),
                workoutPlan.getSubtitle(),
                workoutPlan.getTag(),
                workoutPlan.getLevel(),
                resolveDuration(workoutPlan),
                lastCompletedAt,
                workoutPlan.getCreatedAt(),
                exercises
        );
    }

    /**
     * Duracao estimada da IA quando disponivel; senao, fallback heuristico.
     */
    private static Integer resolveDuration(WorkoutPlan plan) {
        if (plan.getEstimatedDurationMinutes() != null) {
            return plan.getEstimatedDurationMinutes();
        }
        int totalSets = plan.getExercises().stream()
                .mapToInt(e -> e.getSets() != null ? e.getSets() : 0)
                .sum();
        return heuristicDurationMinutes(totalSets);
    }

    /**
     * Formula heuristica de duracao a partir do volume total de series.
     * Fonte unica reutilizada pelo HomeAggregatorService para evitar duplicacao.
     */
    public static int heuristicDurationMinutes(int totalSets) {
        return Math.max(20, (int) Math.round(totalSets * 1.2));
    }
}
