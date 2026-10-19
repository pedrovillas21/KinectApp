package com.kinetic.enums;

import java.util.Locale;

/**
 * Como o exercício é carregado. Define o que o app pede na série e o peso gravado:
 * EXTERNAL grava o peso digitado; BODYWEIGHT grava o peso do aluno + carga extra
 * (aproximação para volume e progressão); NONE grava 0 (mobilidade, alongamento).
 */
public enum LoadType {
    EXTERNAL, BODYWEIGHT, NONE;

    /** Valor vindo da IA ou do painel; se ausente ou inválido, deduz pelo rótulo de carga. */
    public static LoadType resolve(String declared, String weightLabel) {
        if (declared != null) {
            try {
                return valueOf(declared.trim().toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException ignored) {
                // cai na dedução pelo rótulo
            }
        }
        return infer(weightLabel);
    }

    /**
     * Dedução pelo texto de carga ("Peso corporal (RPE 8)", "Sem carga (RPE 3)",
     * "Halteres de 14kg"). Mesmas regras do backfill da V39 e do app.
     */
    public static LoadType infer(String weightLabel) {
        if (weightLabel == null) return EXTERNAL;
        String label = weightLabel.toLowerCase(Locale.ROOT);
        if (label.contains("corporal") || label.contains("peso do corpo") || label.contains("colete")) {
            return BODYWEIGHT;
        }
        if (label.contains("sem carga") || label.contains("sem peso")) return NONE;
        return EXTERNAL;
    }
}
