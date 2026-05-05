package com.kinetic.dtos;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record WorkoutSessionLogRequestDTO(
        @NotNull
        @Min(1)
        Integer durationInSeconds,

        @NotNull
        LocalDate date
) {
}
