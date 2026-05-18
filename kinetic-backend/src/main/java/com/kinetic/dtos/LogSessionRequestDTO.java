package com.kinetic.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record LogSessionRequestDTO(
    @NotNull @Positive Integer durationInSeconds,
    @NotNull LocalDate date,
    @NotEmpty @Valid List<SetLogDto> exercisesLog,
    UUID workoutPlanId
) {}
