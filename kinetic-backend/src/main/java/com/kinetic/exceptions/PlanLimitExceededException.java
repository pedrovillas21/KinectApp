package com.kinetic.exceptions;

/** O plano do personal não comporta mais um aluno ativo. Mapeada para HTTP 402. */
public class PlanLimitExceededException extends RuntimeException {
    public PlanLimitExceededException(String message) {
        super(message);
    }
}
