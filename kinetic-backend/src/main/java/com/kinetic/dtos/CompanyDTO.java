package com.kinetic.dtos;

import java.time.LocalDateTime;
import java.util.UUID;

/** Rede de empresas + dados do dono (usuário DONO), para o painel ROOT. */
public record CompanyDTO(
        UUID id,
        String nome,
        String cnpj,
        String slug,
        LocalDateTime createdAt,
        long units,
        UUID ownerId,
        String ownerName,
        String ownerEmail,
        String ownerStatus
) {
}
