package com.kinetic.dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * ROOT cria uma rede de empresas e o acesso do dono. A senha do dono é gerada pelo
 * sistema e vai por e-mail; o slug vira o prefixo do usuário das filiais (slug.filial).
 */
public record CreateCompanyRequestDTO(
        @NotBlank(message = "O nome da empresa é obrigatório.")
        @Size(max = 255, message = "Nome da empresa longo demais.")
        String companyName,
        @NotBlank(message = "O CNPJ é obrigatório.")
        String companyCnpj,
        @NotBlank(message = "Escolha o apelido da rede (usado no login das filiais).")
        @Pattern(regexp = ValidationRules.HANDLE_REGEX,
                message = "Apelido: letras minúsculas, números e hífen, até 40 caracteres.")
        String slug,
        @NotBlank(message = "O nome do dono é obrigatório.")
        String ownerName,
        @NotBlank(message = "O e-mail do dono é obrigatório.")
        @Email(message = "E-mail inválido.")
        String ownerEmail
) {
}
