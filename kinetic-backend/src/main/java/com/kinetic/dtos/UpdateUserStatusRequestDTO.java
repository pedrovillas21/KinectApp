package com.kinetic.dtos;

import com.kinetic.enums.UserStatus;
import jakarta.validation.constraints.NotNull;

/** Mudança de estado de compliance de uma conta (ROOT). */
public record UpdateUserStatusRequestDTO(
        @NotNull(message = "O status é obrigatório.")
        UserStatus status
) {
}
