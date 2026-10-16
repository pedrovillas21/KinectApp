package com.kinetic.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class InviteCodeRedeemRequestDTO {
    @NotBlank(message = "Informe o código de convite")
    @Size(max = 32, message = "Código de convite inválido")
    private String code;
}
