package com.kinetic.exceptions;

/** Código enviado por e-mail (recuperação de senha ou confirmação de cadastro) inválido, expirado ou esgotado. Mensagem única de propósito. */
public class InvalidCodeException extends RuntimeException {
    public InvalidCodeException(String message) {
        super(message);
    }
}
