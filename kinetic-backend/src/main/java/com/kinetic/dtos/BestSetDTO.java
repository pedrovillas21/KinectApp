package com.kinetic.dtos;

/** Melhor série de um exercício: maior carga (empate → mais repetições). Carga 0 = peso corporal. */
public record BestSetDTO(
        double weightKg,
        int reps
) {}
