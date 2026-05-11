package com.kinetic.dtos;

import java.time.LocalDate;

public record WeightPointDTO(
    LocalDate date,
    Double weight
) {}
