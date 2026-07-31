package com.kinetic.dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TrainerInviteRequestDTO {
    @NotBlank(message = "E-mail do aluno é obrigatório")
    @Email(message = "E-mail com formato inválido")
    private String studentEmail;
}
