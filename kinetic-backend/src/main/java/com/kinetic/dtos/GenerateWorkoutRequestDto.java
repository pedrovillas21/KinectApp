package com.kinetic.dtos;

import jakarta.validation.constraints.NotBlank;

public record GenerateWorkoutRequestDto(
        @NotBlank(message = "O nível não pode estar vazio")
        String level
) {}
