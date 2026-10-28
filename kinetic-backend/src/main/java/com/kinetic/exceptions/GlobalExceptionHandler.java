package com.kinetic.exceptions;

import com.kinetic.services.GeminiService.GeminiUnavailableException;
import com.kinetic.services.GeminiService.InvalidGeminiResponseException;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

/**
 * Tradução centralizada de exceções de negócio em respostas HTTP. Mantém os
 * controllers limpos e evita que mensagens/stack traces internos vazem como
 * 400 genérico (ou 500) ao cliente.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler({EmailAlreadyInUseException.class, PhoneAlreadyInUseException.class,
            ActiveTrainerConflictException.class, TrainerManagedPlanException.class, AiPlanPreviewException.class})
    public ResponseEntity<String> handleConflict(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ex.getMessage());
    }

    @ExceptionHandler(com.kinetic.billing.BillingGatewayException.class)
    public ResponseEntity<String> handleBillingGateway(com.kinetic.billing.BillingGatewayException ex) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(ex.getMessage());
    }

    @ExceptionHandler({AiQuotaExceededException.class, TooManyAttemptsException.class})
    public ResponseEntity<String> handleTooManyRequests(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(ex.getMessage());
    }

    @ExceptionHandler(PlanLimitExceededException.class)
    public ResponseEntity<String> handlePlanLimit(PlanLimitExceededException ex) {
        return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED).body(ex.getMessage());
    }

    /** A IA respondeu fora do formato esperado (a mensagem orienta a gerar de novo). */
    @ExceptionHandler(InvalidGeminiResponseException.class)
    public ResponseEntity<String> handleInvalidGemini(InvalidGeminiResponseException ex) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(ex.getMessage());
    }

    /** Todos os modelos de IA configurados falharam ou estão sem cota. */
    @ExceptionHandler(GeminiUnavailableException.class)
    public ResponseEntity<String> handleGeminiUnavailable(GeminiUnavailableException ex) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(ex.getMessage());
    }

    @ExceptionHandler(InvalidCodeException.class)
    public ResponseEntity<String> handleInvalidCode(InvalidCodeException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
    }

    /**
     * Login de conta com e-mail não confirmado. Corpo em JSON com um código fixo
     * para os clientes reconhecerem o caso e abrirem a tela de confirmação.
     */
    @ExceptionHandler(EmailNotVerifiedException.class)
    public ResponseEntity<Map<String, String>> handleEmailNotVerified(EmailNotVerifiedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("code", "EMAIL_NOT_VERIFIED", "message", ex.getMessage()));
    }

    /**
     * Senha certa de conta com segundo fator: mesmo formato do EMAIL_NOT_VERIFIED, com o
     * token de desafio que a etapa do código (/api/auth/totp/*) recebe de volta.
     */
    @ExceptionHandler(SecondFactorRequiredException.class)
    public ResponseEntity<Map<String, String>> handleSecondFactor(SecondFactorRequiredException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "code", ex.isSetupRequired() ? "TOTP_SETUP_REQUIRED" : "TOTP_REQUIRED",
                "message", ex.getMessage(),
                "challengeToken", ex.getChallengeToken()));
    }

    /** Arquivo acima do limite do multipart (fotos são reduzidas no app/painel antes do envio). */
    @ExceptionHandler(org.springframework.web.multipart.MaxUploadSizeExceededException.class)
    public ResponseEntity<String> handleUploadTooLarge(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body("Arquivo grande demais. Envie uma imagem de até 3 MB.");
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<String> handleForbidden(ForbiddenException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ex.getMessage());
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<String> handleNotFound(EntityNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
    }

    /**
     * Falha de @Valid no corpo. Sem este handler o Spring encaminha para /error, que o
     * Spring Security bloqueia, e o cliente recebia 403 vazio em vez de 400.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<String> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getDefaultMessage())
                .findFirst()
                .orElse("Dados inválidos.");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(message);
    }

    /** JSON malformado ou com tipo errado (mesmo motivo do handler acima). */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<String> handleUnreadable(HttpMessageNotReadableException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Requisição inválida.");
    }

    /** Login de conta suspensa/bloqueada (compliance do ROOT) → 403 amigável. */
    @ExceptionHandler({DisabledException.class, LockedException.class})
    public ResponseEntity<String> handleDisabledAccount(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("Conta suspensa ou bloqueada. Contate o administrador.");
    }
}
