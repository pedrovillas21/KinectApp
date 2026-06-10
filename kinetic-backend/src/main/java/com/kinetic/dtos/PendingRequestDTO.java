package com.kinetic.dtos;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Solicitação de amizade pendente recebida pelo usuário atual.
 * {@code requesterId} é o id de quem enviou — é com ele que o cliente chama
 * accept/remove (a API de conexões opera pelo id do outro usuário).
 */
public record PendingRequestDTO(
        UUID connectionId,
        UUID requesterId,
        String nome,
        String avatarUrl,
        LocalDateTime requestedAt
) {}
