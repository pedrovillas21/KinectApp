package com.kinetic.dtos;

import java.time.Instant;
import java.util.List;

/**
 * Situação da assinatura do personal + catálogo de planos, para a tela
 * "Meu plano" do painel.
 *
 * @param gatewayMode   "DEMO" (nenhuma cobrança real) ou "ASAAS"
 * @param studentLimit  quantos alunos ativos o personal pode ter agora
 * @param checkoutUrl   página para pagar a cobrança em aberto (relativa ao painel no modo demo)
 * @param aiGenerationsLimit cota de gerações de IA do período; nulo = sem cota (personal de empresa)
 * @param aiResetsAt    quando a cota renova (nulo no teste grátis, que é um total único)
 */
public record BillingOverviewDTO(
        String gatewayMode,
        String status,
        String plan,
        String planName,
        int studentLimit,
        long activeStudents,
        boolean canAddStudents,
        Instant trialEndsAt,
        Instant currentPeriodEnd,
        Instant canceledAt,
        String checkoutUrl,
        long aiGenerationsUsed,
        Integer aiGenerationsLimit,
        Instant aiResetsAt,
        List<PlanDTO> plans
) {
    public record PlanDTO(String code, String name, Integer maxStudents, Integer priceCents,
                          Integer aiGenerationsPerMonth, boolean comingSoon) {}
}
