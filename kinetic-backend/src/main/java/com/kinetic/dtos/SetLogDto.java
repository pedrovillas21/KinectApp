package com.kinetic.dtos;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.util.UUID;

public record SetLogDto(
    @NotNull UUID exerciseId,
    @NotNull @Positive Integer setNumber,
    @NotNull @Positive Integer repsPerformed,
    @NotNull @Positive Double weightUsed
) {}
