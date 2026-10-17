package com.kinetic.dtos;

import java.time.Instant;

/**
 * O que a página pública do convite mostra: só nome e foto do personal (nada
 * de e-mail ou celular), já que qualquer um com o link consegue ver.
 */
public record InviteCodePreviewDTO(
        String trainerName,
        String trainerAvatarUrl,
        Instant expiresAt
) {}
