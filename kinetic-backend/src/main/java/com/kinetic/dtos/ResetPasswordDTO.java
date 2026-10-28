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

    // Código de 6 dígitos enviado por e-mail em /api/auth/forgot-password.
    @NotBlank(message = "O código é obrigatório.")
    @Pattern(regexp = "^\\d{6}$", message = "O código deve ter 6 dígitos.")
    private String code;

    @NotBlank(message = "A nova senha é obrigatória.")
    @Pattern(regexp = ValidationRules.PASSWORD_REGEX, message = ValidationRules.PASSWORD_MESSAGE)
    private String newPassword;
}
