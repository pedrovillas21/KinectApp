package com.kinetic.dtos;

import java.util.UUID;

public record UserCardDTO(
        UUID id,
        String nome,
        String avatarUrl,
        String connectionState
) {}
