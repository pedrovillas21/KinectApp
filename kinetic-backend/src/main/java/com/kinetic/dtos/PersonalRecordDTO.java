package com.kinetic.dtos;

import java.time.LocalDate;

/** Recorde de um exercício (nome agrupado sem acento/caixa): melhor série e o dia em que saiu. */
public record PersonalRecordDTO(
        String exercise,
        double weightKg,
        int reps,
        LocalDate date
) {}
