package com.kinetic.dtos;

import java.time.Instant;
import java.util.UUID;

/**
 * Convite por link, visto pelo personal. {@code code} só vem preenchido na
 * resposta de criação/renovação: depois disso o servidor guarda apenas o hash,
 * então para reenviar o personal gera um código novo.
 */
public record TrainerInviteCodeDTO(
        UUID id,
        String code,
        String label,
        Instant expiresAt,
        Instant createdAt,
        boolean expired
) {}
