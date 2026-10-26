package com.kinetic.dtos;

import lombok.Data;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

@Data
public class RegisterDTO {
    @NotBlank(message = "Nome é obrigatório")
    private String nome;

    @NotBlank(message = "Email é obrigatório")
    @Email(message = "E-mail com formato inválido")
    private String email;

    @NotBlank(message = "Senha é obrigatória")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*_=+-]).{8,20}$", message = "A senha deve ter entre 8 e 20 caracteres, contendo pelo menos uma letra maiúscula, uma minúscula e um caractere especial.")
    private String senha;

    /**
     * Opcional. Aceita apenas ALUNO (default) ou PERSONAL (auto-cadastro de
     * personal autônomo). EMPRESA/ROOT jamais nascem por auto-cadastro.
     */
    @Pattern(regexp = "ALUNO|PERSONAL", message = "Papel inválido.")
    private String role;

    private String cpf;

    /** Celular com DDD; usado no atalho de WhatsApp entre personal e aluno. */
    @NotBlank(message = "Celular é obrigatório")
    private String phone;

    /** Marcou "Li e aceito os Termos de Uso e a Política de Privacidade". */
    @AssertTrue(message = "Para criar a conta, aceite os Termos de Uso e a Política de Privacidade.")
    private boolean termsAccepted;
}
