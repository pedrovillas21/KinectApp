package com.kinetic.dtos;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Feedback recebido pela empresa. Quando anônimo, o nome do aluno é omitido.
 * `corporate` é sempre true na leitura da empresa — só vínculos source=COMPANY
 * geram feedback visível (o front usa o flag para o selo "Corporativo").
 */
public record FeedbackDTO(
        UUID id,
        String content,
        boolean anonymous,
        LocalDateTime createdAt,
        /** null quando anônimo. */
        String studentName,
        String personalName,
        boolean corporate
) {
}
