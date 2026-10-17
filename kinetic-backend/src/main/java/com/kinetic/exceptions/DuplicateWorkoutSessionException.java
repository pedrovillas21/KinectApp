package com.kinetic.exceptions;

/**
 * Lançada quando o mesmo treino (mesmo clientSessionId) chega duas vezes ao mesmo
 * tempo e o índice único barra a segunda gravação. Não é erro para o cliente: o
 * treino já está salvo, então o controller responde 200.
 */
public class DuplicateWorkoutSessionException extends RuntimeException {
    public DuplicateWorkoutSessionException() {
        super("Treino já registrado.");
    }
}
