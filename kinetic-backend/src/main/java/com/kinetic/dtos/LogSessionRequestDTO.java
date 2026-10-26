package com.kinetic.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record LogSessionRequestDTO(
    // Até 6 h (em segundos): acima disso o ranking dos amigos vira manipulável. Espelhado em chk_workout_sessions_duration.
    @NotNull @Positive @Max(value = 21600, message = "Duração do treino deve ser de no máximo 6 horas.") Integer durationInSeconds,
    @NotNull LocalDate date,
    // Uma ficha tem até 30 exercícios de até 20 séries (TrainerExerciseRequestDTO): 600 cobre qualquer treino real.
    @NotEmpty @Size(max = 600, message = "Treino com séries demais.") @Valid List<SetLogDto> exercisesLog,
    UUID workoutPlanId,
    // Gerado pelo app uma vez por treino e repetido em toda tentativa de envio:
    // o mesmo id nunca vira dois registros. Opcional para clientes antigos.
    UUID clientSessionId
) {}
