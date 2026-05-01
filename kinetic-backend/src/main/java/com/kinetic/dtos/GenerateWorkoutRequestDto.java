package com.kinetic.dtos;

import java.time.LocalDate;

public record GenerateWorkoutRequestDto(
        LocalDate birthDate,
        Double weight,
        Double height,
        String goal,
        Integer frequency,
        String level
) {}
