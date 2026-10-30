package com.kinetic.utils;

/**
 * Teto do que uma série registrada pode ter, para o histórico não guardar números
 * impossíveis (ex.: 99 reps com 500 kg). O app aplica os mesmos valores
 * (KineticApp/src/utils/setLimits.ts).
 */
public final class SetLimits {

    public static final int MAX_REPS = 100;
    /** Carga digitada na série (externa ou extra sobre o peso corporal). */
    public static final String MAX_WEIGHT_KG = "500";
    /**
     * 1RM estimado (Epley: peso × (1 + reps/30)) acima do recorde humano em qualquer
     * exercício. Pega combinações absurdas que passam nos tetos individuais.
     */
    public static final double MAX_ESTIMATED_1RM_KG = 600;

    private SetLimits() {}

    public static boolean isPlausible(double weightKg, int reps) {
        return weightKg <= 0 || weightKg * (1 + reps / 30.0) <= MAX_ESTIMATED_1RM_KG;
    }
}
