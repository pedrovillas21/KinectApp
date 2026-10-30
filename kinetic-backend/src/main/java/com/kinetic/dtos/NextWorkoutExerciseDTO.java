package com.kinetic.dtos;

/** Linha de exercício no card "Treino de hoje" da Home (só os primeiros da ficha). */
public record NextWorkoutExerciseDTO(
        String name,
        Integer sets,
        String reps
) {}
