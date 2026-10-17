package com.kinetic.dtos;

import java.time.LocalDateTime;
import java.util.UUID;

/** Empresa + dados do responsável (usuário EMPRESA dono), para o painel ROOT. */
public record CompanyDTO(
        UUID id,
        String nome,
        LocalDateTime createdAt,
        UUID ownerId,
        String ownerName,
        String ownerEmail,
        String ownerStatus
) {
}
