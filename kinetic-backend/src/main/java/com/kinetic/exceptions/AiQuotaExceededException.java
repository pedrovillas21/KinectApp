package com.kinetic.exceptions;

/** A cota de gerações de IA (do plano do personal ou do aluno) acabou. Mapeada para HTTP 429. */
public class AiQuotaExceededException extends RuntimeException {
    public AiQuotaExceededException(String message) {
        super(message);
    }
}
