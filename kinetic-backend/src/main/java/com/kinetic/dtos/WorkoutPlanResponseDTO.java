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
        LocalDateTime createdAt,
        List<ExerciseResponseDTO> data
) {
    public static WorkoutPlanResponseDTO fromEntity(WorkoutPlan workoutPlan) {
        List<ExerciseResponseDTO> exercises = workoutPlan.getExercises().stream()
                .map(ExerciseResponseDTO::fromEntity)
                .toList();

        return new WorkoutPlanResponseDTO(
                workoutPlan.getId(),
                workoutPlan.getTitle(),
                workoutPlan.getSubtitle(),
                workoutPlan.getTag(),
                workoutPlan.getLevel(),
                workoutPlan.getCreatedAt(),
                exercises
        );
    }
}
