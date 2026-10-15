package com.kinetic.dtos;

import jakarta.validation.constraints.NotBlank;

/** Celular do próprio usuário (com ou sem máscara/+55); normalizado no service. */
public record UpdatePhoneRequestDTO(
        @NotBlank(message = "O celular é obrigatório.")
        String phone
) {}
