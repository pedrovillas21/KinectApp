package com.kinetic.enums;

/**
 * Catálogo de planos do personal, por faixa de alunos ativos. Preço em
 * centavos para não arrastar erro de ponto flutuante até o gateway.
 * Fonte única de verdade: o painel lista os planos a partir daqui.
 *
 * <p>Cota de IA: gerações de prévia de ficha por mês (~4 por aluno do plano),
 * somadas na conta inteira — o personal distribui entre os alunos como quiser.
 */
public enum BillingPlan {
    START("Start", 5, 1990, 20, false),
    PRO("Pro", 15, 4490, 60, false),
    PLUS("Plus", 30, 7990, 120, false),
    MAX("Max", 60, 12990, 240, false),
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
