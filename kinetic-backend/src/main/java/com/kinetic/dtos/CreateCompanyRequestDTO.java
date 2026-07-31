package com.kinetic.dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Provisionamento de uma empresa pelo ROOT: cria a Company e o usuário EMPRESA
 * dono (com senha inicial). O dono loga no painel com role EMPRESA.
 */
public record CreateCompanyRequestDTO(
        @NotBlank(message = "O nome da empresa é obrigatório.")
        String companyName,

        @NotBlank(message = "O CNPJ é obrigatório.")
        String companyCnpj,

        @NotBlank(message = "O nome do responsável é obrigatório.")
        String ownerName,

        @NotBlank(message = "O e-mail do responsável é obrigatório.")
        @Email(message = "E-mail inválido.")
        String ownerEmail,

        @NotBlank(message = "A senha inicial é obrigatória.")
        @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*_=+-]).{8,20}$", message = "A senha deve ter entre 8 e 20 caracteres, contendo pelo menos uma letra maiúscula, uma minúscula e um caractere especial.")
        String ownerPassword
) {
}
