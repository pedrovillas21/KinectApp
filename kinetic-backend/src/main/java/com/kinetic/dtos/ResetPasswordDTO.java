package com.kinetic.dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class ResetPasswordDTO {
    @NotBlank(message = "O e-mail é obrigatório.")
    @Email(message = "E-mail com formato inválido.")
    private String email;

    @NotBlank(message = "A nova senha é obrigatória.")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*_=+-]).{8,20}$", message = "A senha deve ter entre 8 e 15 caracteres, contendo pelo menos uma letra maiúscula, uma minúscula e um caractere especial.")
    private String newPassword;
}
