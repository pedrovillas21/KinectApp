package com.kinetic.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Motivo de uma ação destrutiva do ROOT; vai para a trilha de auditoria. */
public record ReasonDTO(
        @NotBlank(message = ValidationRules.REASON_REQUIRED)
        @Size(min = ValidationRules.REASON_MIN, max = ValidationRules.REASON_MAX, message = ValidationRules.REASON_SIZE)
        String reason
) {}
