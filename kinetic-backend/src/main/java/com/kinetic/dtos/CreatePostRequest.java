package com.kinetic.dtos;

import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record CreatePostRequest(
        String category,
        String intensity,
        @PositiveOrZero(message = "A duração não pode ser negativa")
        Integer durationMinutes,
        @PositiveOrZero(message = "As calorias não podem ser negativas")
        Integer calories,
        @Size(max = 2200, message = "A legenda deve ter até 2200 caracteres")
        String caption,
        String imageUrl,
        String badge
) {}
