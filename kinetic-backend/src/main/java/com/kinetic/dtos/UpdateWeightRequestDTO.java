package com.kinetic.dtos;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.Positive;

public record UpdateWeightRequestDTO(
    @NotNull @Positive @DecimalMax(value = "500", message = "Peso inválido.") Double newWeight
) {}
