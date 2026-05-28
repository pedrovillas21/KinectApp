package com.kinetic.dtos;

import java.time.LocalDate;

public record UserProfileResponseDTO(
        String fullName,
        String email,
        LocalDate memberSince,
        int consecutiveDaysLogged,
        int totalWorkoutsDone,
        String targetGoal,
        // Protocolo de treino (alimenta a secao editavel do Perfil e a regeneracao via IA).
        LocalDate birthDate,
        Double weight,
        Double height,
        String level,
        Integer frequency,
        String medicalConditions
) {}
