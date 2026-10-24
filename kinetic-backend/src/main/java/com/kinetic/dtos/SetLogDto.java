package com.kinetic.dtos;

import com.kinetic.utils.SetLimits;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.util.UUID;

public record SetLogDto(
    @NotNull UUID exerciseId,
    @NotNull @Min(value = 1, message = "O número da série deve ser pelo menos 1") Integer setNumber,
    @NotNull @Min(value = 1, message = "A série deve ter pelo menos 1 repetição")
    @Max(value = SetLimits.MAX_REPS, message = "Máximo de " + SetLimits.MAX_REPS + " repetições por série")
    Integer repsPerformed,
    // Carga digitada: o peso da série em EXTERNAL, a carga extra em BODYWEIGHT,
    // ignorada em NONE. O peso gravado é calculado no WorkoutSessionService.
    @NotNull @PositiveOrZero(message = "O peso não pode ser negativo.")
    @DecimalMax(value = SetLimits.MAX_WEIGHT_KG, message = "Máximo de " + SetLimits.MAX_WEIGHT_KG + " kg por série")
    Double weightUsed
) {}
