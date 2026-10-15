package com.kinetic.dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

/**
 * Provisionamento de um PERSONAL pelo ROOT, opcionalmente já vinculado a uma
 * empresa (companyId). Sem companyId, é um personal particular.
 */
public record CreatePersonalRequestDTO(
        @NotBlank(message = "O nome é obrigatório.")
        String nome,

        @NotBlank(message = "O e-mail é obrigatório.")
        @Email(message = "E-mail inválido.")
        String email,

        @NotBlank(message = "A senha inicial é obrigatória.")
        @Size(min = 6, message = "A senha deve ter ao menos 6 caracteres.")
        String senha,

        /** Celular (DDD + número); validado/normalizado no service. Usado no atalho de WhatsApp. */
        @NotBlank(message = "O celular é obrigatório.")
        String phone,

        /** Opcional: empresa a que o personal fica vinculado. */
        UUID companyId
) {
}
