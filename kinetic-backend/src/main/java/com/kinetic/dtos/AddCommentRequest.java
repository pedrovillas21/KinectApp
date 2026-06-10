package com.kinetic.dtos;

import jakarta.validation.constraints.NotBlank;

public record AddCommentRequest(
        @NotBlank String body
) {}
