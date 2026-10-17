package com.kinetic.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import jakarta.annotation.PostConstruct;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Envio de e-mails transacionais pela API HTTP da Resend (https://resend.com).
 * A chave fica só no backend (env RESEND_API_KEY) e vai no header Authorization,
 * nunca na URL — assim não aparece em logs de exceção.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final RestClient restClient;

    @Value("${resend.api-key}")
    private String apiKey;

    @Value("${resend.from}")
    private String from;

    // Só para desenvolvimento: escreve o texto do e-mail (com o código) no log do servidor,
    // para testar os fluxos de código sem depender da entrega da Resend.
    @Value("${resend.dev-log-content:false}")
    private boolean devLogContent;

    public EmailService(@Value("${resend.base-url}") String baseUrl) {
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(Objects.requireNonNull(httpClient));
        requestFactory.setReadTimeout(Objects.requireNonNull(Duration.ofSeconds(10)));

        this.restClient = RestClient.builder()
                .baseUrl(Objects.requireNonNull(baseUrl))
                .requestFactory(requestFactory)
                .build();
    }

    /** Falha de envio (provedor fora, chave ausente ou recusada). */
    public static class EmailDeliveryException extends RuntimeException {
        public EmailDeliveryException(String message) {
            super(message);
        }
    }

    @PostConstruct
    void warnIfDevLogEnabled() {
        if (devLogContent) {
            log.warn("DEV_LOG_EMAIL_CONTENT ativo: o conteúdo dos e-mails (inclusive códigos) vai para o log. "
                    + "Nunca use em produção.");
        }
    }

    public void send(String to, String subject, String html, String text) {
        if (devLogContent) {
            log.warn("[DEV] E-mail para {} | {}\n{}", to, subject, text);
        }

        if (apiKey == null || apiKey.isBlank()) {
            throw new EmailDeliveryException("RESEND_API_KEY não configurada; e-mail não enviado.");
        }

        Map<String, Object> body = Map.of(
                "from", from,
                "to", List.of(to),
                "subject", subject,
                "html", html,
                "text", text);

        try {
            restClient.post()
                    .uri("/emails")
                    .header("Authorization", "Bearer " + apiKey)
                    .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON))
                    .body(Objects.requireNonNull(body))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException e) {
            // Só o status: o corpo da Resend pode ecoar o destinatário.
            log.error("Resend recusou o envio de e-mail: HTTP {}", e.getStatusCode().value());
            throw new EmailDeliveryException("Falha ao enviar e-mail.");
        } catch (RestClientException e) {
            log.error("Falha de rede ao chamar a Resend: {}", e.getClass().getSimpleName());
            throw new EmailDeliveryException("Falha ao enviar e-mail.");
        }
    }
}
