package com.kinetic.enums;

/**
 * Catálogo de planos do personal. Preço em centavos para não arrastar erro de
 * ponto flutuante até o gateway. Fonte única de verdade: o painel lista os
 * planos a partir daqui.
 *
 * <p>{@code maxStudents} nulo = alunos ilimitados. A cota de IA é de gerações de
 * prévia de ficha por mês, somadas na conta inteira; além dela o personal pode
 * comprar pacotes extras (ver {@code BillingService}).
 *
 * <p>FREE não é assinável: é o que vale sem plano pago (teste encerrado ou
 * assinatura cancelada e vencida).
 */
public enum BillingPlan {
    /** IA: 1 geração por aluno por mês do calendário, para provar o produto. */
    FREE("Grátis", 3, 0, 3, false),
    BASE("Base", 10, 1490, 15, false),
    PRO("Pro", null, 4990, 100, false),
    /** Equipes/estúdios: ainda não vendável, aparece como "em breve". */
    BUSINESS("Business", null, null, null, true);

    private final String displayName;
    private final Integer maxStudents;
    private final Integer priceCents;
    private final Integer aiGenerationsPerMonth;
    private final boolean comingSoon;

    BillingPlan(String displayName, Integer maxStudents, Integer priceCents, Integer aiGenerationsPerMonth,
                boolean comingSoon) {
        this.displayName = displayName;
        this.maxStudents = maxStudents;
        this.priceCents = priceCents;
        this.aiGenerationsPerMonth = aiGenerationsPerMonth;
        this.comingSoon = comingSoon;
    }

    public String getDisplayName() { return displayName; }
    public Integer getMaxStudents() { return maxStudents; }
    public Integer getPriceCents() { return priceCents; }
    public Integer getAiGenerationsPerMonth() { return aiGenerationsPerMonth; }
    public boolean isComingSoon() { return comingSoon; }
}
