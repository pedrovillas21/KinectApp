package com.kinetic.dtos;

import jakarta.validation.constraints.Size;

public record CreateStoryRequest(
        String imageUrl,
        @Size(max = 2200, message = "A legenda deve ter até 2200 caracteres")
        String caption
) {}
