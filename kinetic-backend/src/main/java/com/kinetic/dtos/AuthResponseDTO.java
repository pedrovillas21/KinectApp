package com.kinetic.dtos;

import java.util.UUID;

public record AuthResponseDTO(String token, UUID id, String nome, String email) {
}
