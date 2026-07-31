package com.kinetic.exceptions;

/** Aluno já possui personal ATIVO — regra de 1 personal por aluno (HTTP 409). */
public class ActiveTrainerConflictException extends RuntimeException {
    public ActiveTrainerConflictException(String message) {
        super(message);
    }
}
