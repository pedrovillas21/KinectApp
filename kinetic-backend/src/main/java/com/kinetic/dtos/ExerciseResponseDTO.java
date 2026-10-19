package com.kinetic.dtos;

import com.kinetic.enums.LoadType;

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
        LoadType loadType,
        String restTime,
        String section,
        String notes
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
                exercise.effectiveLoadType(),
                exercise.getRestTime(),
                exercise.getSection(),
                exercise.getNotes()
        );
    }
}
