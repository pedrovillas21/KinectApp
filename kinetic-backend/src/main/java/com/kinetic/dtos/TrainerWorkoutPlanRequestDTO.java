package com.kinetic.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Ficha montada pelo personal no painel desktop (criar ou substituir o conteudo de uma
 * ficha existente). A ordem de {@code exercises} e a ordem de exibicao no app do aluno.
 */
public record TrainerWorkoutPlanRequestDTO(
        @NotBlank(message = "Nome da ficha é obrigatório")
        @Size(max = 60, message = "Nome da ficha deve ter até 60 caracteres")
        String title,

        @Size(max = 120, message = "Subtítulo deve ter até 120 caracteres")
        String subtitle,

        @Size(max = 20, message = "Identificador do dia deve ter até 20 caracteres")
        String tag,

        // INICIANTE | INTERMEDIÁRIO | PRO. Opcional: cai no nível do aluno.
        String level,

        @Min(value = 5, message = "Duração mínima de 5 minutos")
        @Max(value = 240, message = "Duração máxima de 240 minutos")
        Integer estimatedDurationMinutes,

        @NotEmpty(message = "A ficha precisa de pelo menos um exercício")
        @Size(max = 30, message = "Máximo de 30 exercícios por ficha")
        List<@Valid TrainerExerciseRequestDTO> exercises
) {}
