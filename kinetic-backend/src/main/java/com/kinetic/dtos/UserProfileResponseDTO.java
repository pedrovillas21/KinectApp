package com.kinetic.dtos;

import java.time.LocalDate;

public record UserProfileResponseDTO(
        String fullName,
        String email,
        LocalDate memberSince,
        int consecutiveDaysLogged,
        int totalWorkoutsDone,
        String targetGoal
) {}
