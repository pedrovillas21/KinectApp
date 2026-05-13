package com.kinetic.dtos;

import java.time.LocalDate;
import java.util.UUID;

public record AuthResponseDTO(
        String token,
        UUID id,
        String nome,
        String email,
        String level,
        LocalDate birthDate,
        Double weight,
        Double height,
        String goal,
        Integer frequency,
        String medicalConditions
) {
}
