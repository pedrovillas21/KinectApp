package com.kinetic.dtos;

import java.util.UUID;

public record FeedAuthorDTO(
        UUID id,
        String nome,
        String avatarUrl
) {}
