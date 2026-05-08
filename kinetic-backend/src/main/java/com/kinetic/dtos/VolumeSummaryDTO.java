package com.kinetic.dtos;

import java.util.List;

public record VolumeSummaryDTO(
        List<VolumeByMuscleGroupDTO> byMuscleGroup,
        Double total,
        Integer deltaPercentage
) {}
