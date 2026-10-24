package com.kinetic.dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/** Vincular um personal já cadastrado à empresa (vira funcionário). */
public record VincularFuncionarioRequestDTO(
        @NotBlank(message = "O e-mail do personal é obrigatório.")
        @Email(message = "E-mail inválido.")
        String email
) {
}
