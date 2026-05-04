package com.kinetic.dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VerifyEmailDTO {
    @NotBlank(message = "O e-mail é obrigatório.")
    @Email(message = "E-mail com formato inválido.")
    private String email;
}
