package com.kinetic.billing;

import com.fasterxml.jackson.databind.JsonNode;
import com.kinetic.enums.BillingPlan;
import com.kinetic.models.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.math.BigDecimal;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;

/**
 * Integração com a API v3 do Asaas (https://docs.asaas.com). Ativada com
 * {@code billing.gateway=asaas}; por padrão o sistema usa o gateway demo.
 *
 * <p><b>Ainda não validada contra o sandbox</b> (não há conta): antes de ligar
 * em produção, conferir na documentação os formatos de request/resposta e os
 * nomes dos eventos de webhook usados aqui, e rodar o fluxo completo no sandbox.
 *
 * <p>A chave fica só no backend (env ASAAS_API_KEY) e vai no header
 * {@code access_token}, nunca na URL.
 */
@Component
@ConditionalOnProperty(name = "billing.gateway", havingValue = "asaas")
public class AsaasPaymentGateway implements PaymentGateway {

    private static final Logger log = LoggerFactory.getLogger(AsaasPaymentGateway.class);

    private final RestClient restClient;
    private final String apiKey;
    private final String webhookToken;

    public AsaasPaymentGateway(@Value("${asaas.base-url}") String baseUrl,
                               @Value("${asaas.api-key:}") String apiKey,
                               @Value("${asaas.webhook-token:}") String webhookToken) {
        this.apiKey = apiKey;
        this.webhookToken = webhookToken;

        HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(Objects.requireNonNull(httpClient));
        requestFactory.setReadTimeout(Objects.requireNonNull(Duration.ofSeconds(15)));

        this.restClient = RestClient.builder()
                .baseUrl(Objects.requireNonNull(baseUrl))
                .requestFactory(requestFactory)
                .defaultHeader("User-Agent", "Kinetic")
                .build();
    }

    @Override
    public String name() {
        return "ASAAS";
    }

    @Override
    public String createCustomer(User trainer) {
        if (trainer.getCpf() == null || trainer.getCpf().isBlank()) {
            throw new IllegalArgumentException("Cadastre seu CPF antes de assinar um plano.");
        }
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("name", trainer.getNome());
        body.put("email", trainer.getEmail());
        body.put("cpfCnpj", trainer.getCpf());
        if (trainer.getPhone() != null) {
            body.put("mobilePhone", trainer.getPhone());
        }
        body.put("externalReference", trainer.getId().toString());
        return post("/customers", body).path("id").asText();
    }

    @Override
    public GatewaySubscription createSubscription(String customerId, BillingPlan plan, LocalDate firstDueDate,
                                                  String externalReference) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("customer", customerId);
        // UNDEFINED: o personal escolhe Pix, boleto ou cartão na página da cobrança.
        body.put("billingType", "UNDEFINED");
        body.put("value", toReais(plan));
        body.put("nextDueDate", firstDueDate.toString());
        body.put("cycle", "MONTHLY");
        body.put("description", description(plan));
        body.put("externalReference", externalReference);
        String subscriptionId = post("/subscriptions", body).path("id").asText();

        // A página de pagamento é a da 1ª cobrança gerada pela assinatura.
        JsonNode payments = get("/subscriptions/" + subscriptionId + "/payments");
        String invoiceUrl = payments.path("data").path(0).path("invoiceUrl").asText(null);
        return new GatewaySubscription(subscriptionId, invoiceUrl);
    }

    @Override
    public void updateSubscriptionPlan(String subscriptionId, BillingPlan plan) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("value", toReais(plan));
        body.put("description", description(plan));
        body.put("updatePendingPayments", true);
        call(() -> restClient.put().uri("/subscriptions/{id}", subscriptionId)
                .header("access_token", requireKey())
                .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON))
                .body(body)
                .retrieve()
                .toBodilessEntity());
    }

    @Override
    public void cancelSubscription(String subscriptionId) {
        call(() -> restClient.delete().uri("/subscriptions/{id}", subscriptionId)
                .header("access_token", requireKey())
                .retrieve()
                .toBodilessEntity());
    }

    // ── Webhook ─────────────────────────────────────────────────────────────

    /** Confere o token que o Asaas manda no header {@code asaas-access-token} (comparação em tempo constante). */
    public boolean isValidWebhookToken(String received) {
        if (webhookToken == null || webhookToken.isBlank() || received == null) {
            return false;
        }
        return MessageDigest.isEqual(webhookToken.getBytes(StandardCharsets.UTF_8),
                received.getBytes(StandardCharsets.UTF_8));
    }

    /** Traduz o corpo do webhook do Asaas para um {@link GatewayEvent}. */
    public GatewayEvent parseWebhook(JsonNode body) {
        String eventId = body.path("id").asText(null);
        String event = body.path("event").asText("");
        JsonNode payment = body.path("payment");
        return switch (event) {
            case "PAYMENT_CONFIRMED", "PAYMENT_RECEIVED" -> new GatewayEvent(eventId, GatewayEvent.Type.PAYMENT_PAID,
                    payment.path("subscription").asText(null), parseDate(payment.path("dueDate").asText(null)));
            case "PAYMENT_OVERDUE" -> new GatewayEvent(eventId, GatewayEvent.Type.PAYMENT_OVERDUE,
                    payment.path("subscription").asText(null), parseDate(payment.path("dueDate").asText(null)));
            case "SUBSCRIPTION_DELETED", "SUBSCRIPTION_INACTIVATED" -> new GatewayEvent(eventId,
                    GatewayEvent.Type.SUBSCRIPTION_ENDED, body.path("subscription").path("id").asText(null), null);
            default -> new GatewayEvent(eventId, GatewayEvent.Type.IGNORED, null, null);
        };
    }

    // ── Internos ────────────────────────────────────────────────────────────

    private JsonNode post(String path, Map<String, Object> body) {
        return call(() -> restClient.post().uri(Objects.requireNonNull(path))
                .header("access_token", requireKey())
                .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON))
                .body(Objects.requireNonNull(body))
                .retrieve()
                .body(JsonNode.class));
    }

    private JsonNode get(String path) {
        return call(() -> restClient.get().uri(Objects.requireNonNull(path))
                .header("access_token", requireKey())
                .retrieve()
                .body(JsonNode.class));
    }

    private <T> T call(java.util.function.Supplier<T> request) {
        try {
            T result = request.get();
            if (result == null) {
                throw new BillingGatewayException("Resposta vazia do sistema de pagamento.");
            }
            return result;
        } catch (RestClientResponseException e) {
            // Só o status: o corpo pode ecoar dados do cliente (CPF, e-mail).
            log.error("Asaas recusou a requisição: HTTP {}", e.getStatusCode().value());
            throw new BillingGatewayException("O sistema de pagamento recusou a operação. Tente novamente.");
        } catch (RestClientException e) {
            log.error("Falha de rede ao chamar o Asaas: {}", e.getClass().getSimpleName());
            throw new BillingGatewayException("Não foi possível falar com o sistema de pagamento.");
        }
    }

    private String requireKey() {
        if (apiKey == null || apiKey.isBlank()) {
            throw new BillingGatewayException("ASAAS_API_KEY não configurada.");
        }
        return apiKey;
    }

    private static BigDecimal toReais(BillingPlan plan) {
        return BigDecimal.valueOf(plan.getPriceCents(), 2);
    }

    private static String description(BillingPlan plan) {
        return "Kinetic – plano " + plan.getDisplayName() + " (até " + plan.getMaxStudents() + " alunos)";
    }

    private static LocalDate parseDate(String value) {
        try {
            return value == null ? null : LocalDate.parse(value);
        } catch (RuntimeException e) {
            return null;
        }
    }
}
