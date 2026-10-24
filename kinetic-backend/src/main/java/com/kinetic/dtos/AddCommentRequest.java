package com.kinetic.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AddCommentRequest(
        @NotBlank
        @Size(max = 2000, message = "O comentário deve ter até 2000 caracteres")
        String body
) {}
