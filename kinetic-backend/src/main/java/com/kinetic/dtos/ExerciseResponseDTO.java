package com.kinetic.dtos;

import com.kinetic.models.Exercise;

import java.util.UUID;

public record ExerciseResponseDTO(
        UUID id,
        String name,
        String muscles,
        String type,
        Integer sets,
        String reps,
        String weight,
        String restTime
) {
    public static ExerciseResponseDTO fromEntity(Exercise exercise) {
        return new ExerciseResponseDTO(
                exercise.getId(),
                exercise.getName(),
                exercise.getMuscles(),
                exercise.getType(),
                exercise.getSets(),
                exercise.getReps(),
                exercise.getWeight(),
                exercise.getRestTime()
        );
    }
}
