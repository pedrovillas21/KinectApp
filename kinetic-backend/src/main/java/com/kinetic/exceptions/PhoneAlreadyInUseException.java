package com.kinetic.exceptions;

/** Lançada ao gravar um celular que já pertence a outra conta. Mapeada para HTTP 409. */
public class PhoneAlreadyInUseException extends RuntimeException {
    public PhoneAlreadyInUseException(String message) {
        super(message);
    }
}
