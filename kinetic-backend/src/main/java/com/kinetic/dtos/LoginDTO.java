package com.kinetic.dtos;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Data
public class LoginDTO {
    // E-mail, ou o usuário da filial (rede.filial): por isso sem @Email.
    @NotBlank(message = "Informe o e-mail ou o usuário")
    @Size(max = 254, message = "E-mail ou usuário longo demais")
    private String email;

    @NotBlank(message = "Senha é obrigatória")
    private String senha;
}
