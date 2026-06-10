package com.kinetic.dtos;

import java.util.UUID;

public record SquadMemberDTO(
        UUID id,
        String nome,
        String avatarUrl,
        String status,
        boolean hasNewUpdate
) {}
