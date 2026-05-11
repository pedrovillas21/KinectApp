package com.kinetic.dtos;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.util.UUID;

public record SetLogDto(
    @NotNull UUID exerciseId,
    @NotNull @Min(value = 1, message = "O número da série deve ser pelo menos 1") Integer setNumber,
    @NotNull @Min(value = 1, message = "A série deve ter pelo menos 1 repetição") Integer repsPerformed,
    @NotNull @PositiveOrZero(message = "O peso não pode ser negativo. Use 0 para peso corporal.") Double weightUsed
) {}
