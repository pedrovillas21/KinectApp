package com.kinetic.exceptions;

/** Prévia de fichas por IA que não pode mais ser aprovada (já aprovada ou expirada). */
public class AiPlanPreviewException extends RuntimeException {
    public AiPlanPreviewException(String message) {
        super(message);
    }
}
