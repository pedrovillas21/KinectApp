package com.kinetic.dtos;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Pedido do personal para a IA montar fichas de um aluno (gera só a prévia). */
public record TrainerAiPlanRequestDTO(
        @NotBlank(message = "Descreva o treino que você quer")
        @Size(min = 10, max = 1000, message = "O pedido deve ter entre 10 e 1000 caracteres")
        String prompt,

        @NotNull(message = "Informe quantas fichas gerar")
        @Min(value = 1, message = "Gere pelo menos 1 ficha")
        @Max(value = 6, message = "Gere no máximo 6 fichas de uma vez")
        Integer planCount,

        // Duração alvo de cada treino. Opcional.
        @Min(value = 15, message = "Duração mínima de 15 minutos")
        @Max(value = 240, message = "Duração máxima de 240 minutos")
        Integer durationMinutes,

        // INICIANTE | INTERMEDIÁRIO | PRO. Opcional: cai no nível do aluno.
        String level
) {}
