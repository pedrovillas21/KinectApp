package com.kinetic.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class ChangePasswordDTO {
    @NotBlank(message = "A senha atual é obrigatória.")
    private String currentPassword;

    @NotBlank(message = "A nova senha é obrigatória.")
    @Pattern(regexp = ValidationRules.PASSWORD_REGEX, message = ValidationRules.PASSWORD_MESSAGE)
    private String newPassword;
}
