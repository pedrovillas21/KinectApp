package com.kinetic.exceptions;

/**
 * Login com senha correta de uma conta que ainda não confirmou o e-mail. Só é
 * lançada depois de a senha conferir, para não revelar quais contas existem.
 */
public class EmailNotVerifiedException extends RuntimeException {
    public EmailNotVerifiedException(String message) {
        super(message);
    }
}
