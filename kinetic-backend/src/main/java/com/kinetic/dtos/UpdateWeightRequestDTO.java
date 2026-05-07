package com.kinetic.dtos;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record UpdateWeightRequestDTO(
    @NotNull @Positive Double newWeight
) {}
