package com.kinetic.dtos;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class InviteCodeCreateRequestDTO {
    /** Opcional: nome para o personal reconhecer o convite na lista. */
    @Size(max = 80, message = "O nome do convite deve ter no máximo 80 caracteres")
    private String label;
}
