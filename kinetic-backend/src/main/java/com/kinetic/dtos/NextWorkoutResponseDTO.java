package com.kinetic.dtos;

import java.util.List;

/**
 * Próximo treino da Home. {@code exercises}: os 3 primeiros da ficha.
 * {@code prescribedBy}: personal que montou a ficha (nulo se o próprio aluno/IA gerou).
 */
public record NextWorkoutResponseDTO(
        String tag,
        String name,
        int durationInMinutes,
        int exerciseCount,
        List<String> muscleGroups,
        String workoutPlanId,
        List<NextWorkoutExerciseDTO> exercises,
        UserRefDTO prescribedBy
) {}
