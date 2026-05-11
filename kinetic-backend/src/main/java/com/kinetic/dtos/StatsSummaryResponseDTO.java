package com.kinetic.dtos;

public record StatsSummaryResponseDTO(
        Boolean needsWeightUpdate,
        String period,
        Integer efficiencyPercentage,
        Integer completedSessions,
        Integer targetSessions,
        WeightSummaryDTO weight,
        VolumeSummaryDTO volume,
        CommunityComparisonDTO community,
        StatsInsightDTO insight
) {}
