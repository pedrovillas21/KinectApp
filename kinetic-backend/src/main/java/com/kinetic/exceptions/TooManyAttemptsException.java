package com.kinetic.exceptions;

/** Limite de tentativas (ex.: login por IP + e-mail) estourado. Mapeada para HTTP 429. */
public class TooManyAttemptsException extends RuntimeException {
    public TooManyAttemptsException(String message) {
        super(message);
    }
}
