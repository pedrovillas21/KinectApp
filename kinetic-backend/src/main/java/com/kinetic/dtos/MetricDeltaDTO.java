package com.kinetic.dtos;

public record MetricDeltaDTO(
        double previous,
        double current,
        double delta,
        boolean good
) {}
