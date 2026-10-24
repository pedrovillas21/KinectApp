package com.kinetic.dtos;

/** Exercício resumido num card de treino (feed e aba "Treinos" do perfil). */
public record WorkoutExerciseSummaryDTO(
        String name,
        int setsCount,
        BestSetDTO bestSet
) {}
