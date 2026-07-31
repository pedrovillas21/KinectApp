package com.kinetic.dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/** Vincular um aluno a um personal da empresa (cria vínculo source=COMPANY). */
public record VincularAlunoRequestDTO(
        @NotBlank(message = "O e-mail do aluno é obrigatório.")
        @Email(message = "E-mail do aluno inválido.")
        String studentEmail,

        @NotBlank(message = "O e-mail do personal é obrigatório.")
        @Email(message = "E-mail do personal inválido.")
        String trainerEmail
) {
}
