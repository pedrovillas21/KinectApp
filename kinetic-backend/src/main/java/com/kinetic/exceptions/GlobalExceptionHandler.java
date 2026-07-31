package com.kinetic.exceptions;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Tradução centralizada de exceções de negócio em respostas HTTP. Mantém os
 * controllers limpos e evita que mensagens/stack traces internos vazem como
 * 400 genérico (ou 500) ao cliente.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(EmailAlreadyInUseException.class)
    public ResponseEntity<String> handleEmailInUse(EmailAlreadyInUseException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ex.getMessage());
    }

    @ExceptionHandler(ActiveTrainerConflictException.class)
    public ResponseEntity<String> handleActiveTrainerConflict(ActiveTrainerConflictException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ex.getMessage());
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<String> handleNotFound(EntityNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
    }

    /** Login de conta suspensa/bloqueada (compliance do ROOT) → 403 amigável. */
    @ExceptionHandler({DisabledException.class, LockedException.class})
    public ResponseEntity<String> handleDisabledAccount(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("Conta suspensa ou bloqueada. Contate o administrador.");
    }
}
