package com.kinetic.dtos;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

/**
 * Exercicio enviado pelo personal ao criar/editar uma ficha. {@code id} presente =
 * exercicio existente (atualizado no lugar, preservando o historico de series);
 * ausente = exercicio novo.
 */
public record TrainerExerciseRequestDTO(
        UUID id,

        @NotBlank(message = "Nome do exercício é obrigatório")
        @Size(max = 120, message = "Nome do exercício deve ter até 120 caracteres")
        String name,

        @Size(max = 40, message = "Grupo muscular deve ter até 40 caracteres")
        String muscles,

        @Size(max = 40, message = "Tipo deve ter até 40 caracteres")
        String type,

        @NotNull(message = "Número de séries é obrigatório")
        @Min(value = 1, message = "Mínimo de 1 série")
        @Max(value = 20, message = "Máximo de 20 séries")
        Integer sets,

        @NotBlank(message = "Repetições são obrigatórias")
        @Size(max = 40, message = "Repetições devem ter até 40 caracteres")
        String reps,

        @Size(max = 80, message = "Carga deve ter até 80 caracteres")
        String weight,

        @Size(max = 40, message = "Descanso deve ter até 40 caracteres")
        String restTime,

        String section,

        @Size(max = 500, message = "Observações devem ter até 500 caracteres")
        String notes
) {}
