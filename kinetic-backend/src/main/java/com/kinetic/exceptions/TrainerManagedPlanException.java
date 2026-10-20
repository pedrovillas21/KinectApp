package com.kinetic.exceptions;

/** Aluno tentou mudar algo que o personal gere: ficha montada por ele ou medidas corporais (HTTP 409). */
public class TrainerManagedPlanException extends RuntimeException {
    public TrainerManagedPlanException(String message) {
        super(message);
    }
}
