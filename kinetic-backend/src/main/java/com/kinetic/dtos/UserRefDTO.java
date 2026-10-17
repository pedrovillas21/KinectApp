package com.kinetic.dtos;

import java.util.UUID;

/** Referência curta a outro usuário (ex.: personal que prescreveu a ficha). */
public record UserRefDTO(
        UUID id,
        String name,
        String avatarUrl
) {}
