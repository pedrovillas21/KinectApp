package com.kinetic.dtos;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/** Prévia gerada pela IA. Nada foi salvo no app do aluno: falta a aprovação do personal. */
public record AiPlanPreviewDTO(
        UUID generationId,
        LocalDateTime createdAt,
        LocalDateTime expiresAt,
        List<AiPlanDraftDTO.Note> understood,
        List<AiPlanDraftDTO.Note> attentionPoints,
        List<AiPlanDraftDTO.Plan> plans
) {}
