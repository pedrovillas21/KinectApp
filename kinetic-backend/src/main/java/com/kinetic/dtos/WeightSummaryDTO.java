package com.kinetic.dtos;

import java.util.List;

public record WeightSummaryDTO(
        List<WeightPointDTO> history,
        Double current,
        Double delta,
        String unit
) {}
