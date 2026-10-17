package com.kinetic.exceptions;

/** Aluno tentou regenerar por IA uma ficha montada pelo personal (HTTP 409). */
public class TrainerManagedPlanException extends RuntimeException {
    public TrainerManagedPlanException(String message) {
        super(message);
    }
}
