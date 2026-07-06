package com.kinetic.dtos;

import com.kinetic.models.Exercise;
import com.kinetic.models.WorkoutPlan;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public record WorkoutPlanResponseDTO(
        UUID id,
        String title,
        String subtitle,
        String tag,
        String level,
        Integer estimatedDurationMinutes,
        Integer estimatedTotalVolumeKg,
        LocalDateTime lastCompletedAt,
        LocalDateTime createdAt,
        List<ExerciseResponseDTO> data
) {
    /**
     * Sobrecarga sem ultima execucao (ex.: logo apos a geracao). lastCompletedAt = null.
     */
    public static WorkoutPlanResponseDTO fromEntity(WorkoutPlan workoutPlan) {
        return fromEntity(workoutPlan, null);
    }

    public static WorkoutPlanResponseDTO fromEntity(WorkoutPlan workoutPlan, LocalDateTime lastCompletedAt) {
        List<ExerciseResponseDTO> exercises = workoutPlan.getExercises().stream()
                .map(ExerciseResponseDTO::fromEntity)
                .toList();

        return new WorkoutPlanResponseDTO(
                workoutPlan.getId(),
                workoutPlan.getTitle(),
                workoutPlan.getSubtitle(),
                workoutPlan.getTag(),
                workoutPlan.getLevel(),
                resolveDuration(workoutPlan),
                computeTotalVolumeKg(workoutPlan),
                lastCompletedAt,
                workoutPlan.getCreatedAt(),
                exercises
        );
    }

    /**
     * Duracao estimada da IA quando disponivel; senao, fallback heuristico.
     */
    private static Integer resolveDuration(WorkoutPlan plan) {
        if (plan.getEstimatedDurationMinutes() != null) {
            return plan.getEstimatedDurationMinutes();
        }
        int totalSets = plan.getExercises().stream()
                .mapToInt(e -> e.getSets() != null ? e.getSets() : 0)
                .sum();
        return heuristicDurationMinutes(totalSets);
    }

    /**
     * Formula heuristica de duracao a partir do volume total de series.
     * Fonte unica reutilizada pelo HomeAggregatorService para evitar duplicacao.
     */
    public static int heuristicDurationMinutes(int totalSets) {
        return Math.max(20, (int) Math.round(totalSets * 1.2));
    }

    // Peso expresso em kg dentro do texto livre de 'weight' (ex.: "Halteres de 14kg (RPE 8)").
    // Ancorado em "kg" para nao confundir com o numero de RPE ("Peso corporal (RPE 8)").
    private static final Pattern WEIGHT_KG =
            Pattern.compile("(\\d+(?:[.,]\\d+)?)\\s*kg", Pattern.CASE_INSENSITIVE);
    // Faixa de repeticoes ("8-12", "8 a 12") -> media; senao usa o primeiro numero.
    private static final Pattern REPS_RANGE =
            Pattern.compile("(\\d+)\\s*(?:-|a|ate|à|–)\\s*(\\d+)", Pattern.CASE_INSENSITIVE);
    private static final Pattern FIRST_INT = Pattern.compile("\\d+");

    /**
     * Volume total aproximado da ficha, em kg: soma de (series x reps_medias x peso_kg)
     * dos exercicios cujo peso esta expresso em kg. Exercicios sem carga mensuravel
     * (peso corporal, sem carga, zona de FC) nao contribuem. Retorna null quando nenhum
     * exercicio tem carga em kg — o app entao omite a linha de "volume total".
     */
    private static Integer computeTotalVolumeKg(WorkoutPlan plan) {
        double total = 0;
        boolean anyWeighted = false;
        for (Exercise e : plan.getExercises()) {
            double kg = parseWeightKg(e.getWeight());
            if (kg <= 0) continue;
            int sets = e.getSets() != null ? e.getSets() : 0;
            double reps = parseAvgReps(e.getReps());
            if (sets <= 0 || reps <= 0) continue;
            total += sets * reps * kg;
            anyWeighted = true;
        }
        return anyWeighted ? (int) Math.round(total) : null;
    }

    private static double parseWeightKg(String weight) {
        if (weight == null) return 0;
        Matcher m = WEIGHT_KG.matcher(weight);
        if (!m.find()) return 0;
        try {
            return Double.parseDouble(m.group(1).replace(',', '.'));
        } catch (NumberFormatException ex) {
            return 0;
        }
    }

    private static double parseAvgReps(String reps) {
        if (reps == null) return 0;
        Matcher range = REPS_RANGE.matcher(reps);
        if (range.find()) {
            return (Double.parseDouble(range.group(1)) + Double.parseDouble(range.group(2))) / 2.0;
        }
        Matcher num = FIRST_INT.matcher(reps);
        if (num.find()) {
            return Double.parseDouble(num.group());
        }
        return 0;
    }
}
