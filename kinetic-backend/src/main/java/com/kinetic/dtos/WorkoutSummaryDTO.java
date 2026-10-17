package com.kinetic.dtos;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Resumo de uma sessão de treino registrada. {@code exercises} traz no máximo 3;
 * {@code moreExercises} é quantos ficaram de fora. {@code recordsCount} conta os
 * exercícios em que a carga superou o melhor que o usuário já tinha feito antes.
 */
public record WorkoutSummaryDTO(
        UUID id,
        LocalDate date,
        String title,
        Integer durationSeconds,
        double volumeKg,
        int recordsCount,
        List<WorkoutExerciseSummaryDTO> exercises,
        int moreExercises
) {}
