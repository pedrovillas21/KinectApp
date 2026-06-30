package com.kinetic.dtos;

import java.util.List;

public record GeneratedWorkoutPlanDto(
        String title,
        String subtitle,
        String tag,
        Integer estimatedDurationMinutes,
        List<GeneratedExerciseDto> data
) {}
