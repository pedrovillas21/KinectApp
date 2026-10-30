package com.kinetic.dtos;

import com.kinetic.enums.UserStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Mudança de estado de compliance de uma conta (ROOT). O motivo vai para a trilha de auditoria. */
public record UpdateUserStatusRequestDTO(
        @NotNull(message = "O status é obrigatório.")
        UserStatus status,
        @NotBlank(message = ValidationRules.REASON_REQUIRED)
        @Size(min = ValidationRules.REASON_MIN, max = ValidationRules.REASON_MAX, message = ValidationRules.REASON_SIZE)
        String reason
) {
}
