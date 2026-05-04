package com.kinetic.dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ResetPasswordDTO {
    @NotBlank(message = "O e-mail é obrigatório.")
    @Email(message = "E-mail com formato inválido.")
    private String email;

    @NotBlank(message = "A nova senha é obrigatória.")
    @Size(min = 8, message = "A nova senha deve ter no mínimo 8 caracteres.")
    private String newPassword;
}
