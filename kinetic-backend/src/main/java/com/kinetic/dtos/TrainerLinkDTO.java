package com.kinetic.dtos;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Visão de um vínculo personal↔aluno. O campo {@code peer} é o "outro lado"
 * da relação: para o aluno é o personal; para o personal é o aluno.
 * {@code peer.phone} só vem preenchido com vínculo ATIVO (atalho de WhatsApp).
 * {@code frozen}: aluno acima do limite do plano Grátis do personal (só leitura para ele).
 */
public record TrainerLinkDTO(
        UUID id,
        PeerDTO peer,
        String status,
        String source,
        LocalDateTime createdAt,
        LocalDateTime respondedAt,
        boolean frozen
) {
    public record PeerDTO(UUID id, String nome, String email, String avatarUrl, String phone) {}
}
