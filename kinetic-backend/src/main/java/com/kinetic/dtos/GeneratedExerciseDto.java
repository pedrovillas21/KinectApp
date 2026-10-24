package com.kinetic.dtos;

public record GeneratedExerciseDto(
        String name,
        String muscles,
        String type,
        Integer sets,
        String reps,
        String weight,
        /** EXTERNAL, BODYWEIGHT ou NONE; se a IA errar, deduz pelo rótulo de carga. */
        String loadType,
        String restTime,
        String section
) {}
