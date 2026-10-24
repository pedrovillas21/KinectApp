package com.kinetic.exceptions;

/** O usuário está autenticado mas não pode ver/fazer isso (ex.: perfil de quem não é amigo). HTTP 403. */
public class ForbiddenException extends RuntimeException {
    public ForbiddenException(String message) {
        super(message);
    }
}
