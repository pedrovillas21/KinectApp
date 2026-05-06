package com.kinetic.dtos;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDate;

public record GenerateWorkoutRequestDto(
        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate birthDate,
        Double weight,
        Double height,
        String goal,
        Integer frequency,
        String level
) {}
