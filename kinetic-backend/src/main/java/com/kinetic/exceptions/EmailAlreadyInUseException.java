package com.kinetic.exceptions;

/** Lançada ao tentar registrar um e-mail que já existe. Mapeada para HTTP 409. */
public class EmailAlreadyInUseException extends RuntimeException {
    public EmailAlreadyInUseException(String message) {
        super(message);
    }
}
