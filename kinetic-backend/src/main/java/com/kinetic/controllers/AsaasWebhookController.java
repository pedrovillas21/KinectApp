package com.kinetic.controllers;

import com.fasterxml.jackson.databind.JsonNode;
import com.kinetic.billing.AsaasPaymentGateway;
import com.kinetic.services.BillingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Webhook de cobranças do Asaas (sem login: autenticado pelo token que o Asaas
 * manda no header {@code asaas-access-token}, configurado ao criar o webhook).
 * Responde 200 também para eventos ignorados, senão o Asaas reenvia sem parar.
 */
@RestController
@RequestMapping("/api/webhooks/asaas")
@RequiredArgsConstructor
@Tag(name = "Webhooks", description = "Notificações de provedores externos (pagamentos).")
public class AsaasWebhookController {

    private final ObjectProvider<AsaasPaymentGateway> asaasGateway;
    private final BillingService billingService;

    @Operation(
            summary = "Receber evento do Asaas",
            description = "Pagamento confirmado/recebido, atraso e remoção de assinatura. 404 quando o gateway "
                    + "configurado não é o Asaas; 401 com token inválido."
    )
    @PostMapping
    public ResponseEntity<Void> receive(
            @RequestHeader(value = "asaas-access-token", required = false) String token,
            @RequestBody JsonNode body) {
        AsaasPaymentGateway gateway = asaasGateway.getIfAvailable();
        if (gateway == null) {
            return ResponseEntity.notFound().build();
        }
        if (!gateway.isValidWebhookToken(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        billingService.handleEvent(gateway.parseWebhook(body));
        return ResponseEntity.ok().build();
    }
}
