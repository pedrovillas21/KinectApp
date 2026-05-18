package com.kinetic.dtos;

import java.util.List;

public record NextWorkoutResponseDTO(
        String tag,
        String name,
        int durationInMinutes,
        int exerciseCount,
        List<String> muscleGroups,
        String workoutPlanId
) {}
