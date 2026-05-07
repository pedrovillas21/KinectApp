package com.kinetic.dtos;

import java.util.List;

public record StatsSummaryResponseDTO(
    Boolean needsWeightUpdate,
    Integer efficiencyPercentage,
    List<VolumeByMuscleGroupDTO> volumeByMuscleGroup,
    List<WeightPointDTO> weightHistory
) {}
