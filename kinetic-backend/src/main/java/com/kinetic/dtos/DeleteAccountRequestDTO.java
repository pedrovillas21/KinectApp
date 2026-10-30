package com.kinetic.dtos;

import jakarta.validation.constraints.NotBlank;

/** Confirmação da exclusão da própria conta: a senha atual do usuário logado. */
public record DeleteAccountRequestDTO(
        @NotBlank(message = "Informe sua senha para excluir a conta.")
        String password
) {}
