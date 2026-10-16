package com.kinetic.dtos;

import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.util.UUID;

/**
 * Corpo do POST /api/social/posts. Para ligar o post a um treino registrado (card com
 * exercícios/volume/recordes), mande {@code clientSessionId} — o mesmo id enviado em
 * /api/sessions/log — ou {@code workoutSessionId}. Ambos opcionais; o treino
 * precisa ser do próprio autor.
 */
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
        String badge,
        UUID workoutSessionId,
        UUID clientSessionId
) {}
