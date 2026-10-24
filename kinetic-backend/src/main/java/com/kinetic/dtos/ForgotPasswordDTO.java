package com.kinetic.dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ForgotPasswordDTO {
    @NotBlank(message = "O e-mail é obrigatório.")
    @Email(message = "E-mail com formato inválido.")
    @Size(max = 254, message = "E-mail longo demais.")
    private String email;
}
