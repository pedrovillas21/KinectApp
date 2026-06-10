package com.kinetic.dtos;

import java.time.LocalDate;
import java.util.Map;

public record PlanEvolutionResponseDTO(
        boolean available,
        boolean currentCycleStarted,
        LocalDate currentCycleStart,
        String goal,
        MetricDeltaDTO weight,
        MetricDeltaDTO volume,
        MetricDeltaDTO adherence,
        int previousCompletedSessions,
        int currentCompletedSessions,
        Map<String, Double> volumeByMuscle,
        StatsInsightDTO insight
) {}
