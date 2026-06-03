package com.kinetic.dtos;

public record RefreshResponseDTO(
        String token,
        String refreshToken
) {
}
