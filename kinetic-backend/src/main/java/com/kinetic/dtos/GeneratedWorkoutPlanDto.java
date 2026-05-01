package com.kinetic.dtos;

import java.util.List;

public record GeneratedWorkoutPlanDto(
        String title,
        String subtitle,
        String tag,
        List<GeneratedExerciseDto> data
) {}
