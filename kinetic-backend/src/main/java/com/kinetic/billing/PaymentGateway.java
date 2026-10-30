package com.kinetic.billing;

import com.kinetic.enums.BillingPlan;
import com.kinetic.models.User;

import java.time.LocalDate;

/**
 * Porta para o provedor de pagamento da assinatura do personal. Hoje há duas
 * implementações, escolhidas por {@code billing.gateway}: {@code demo} (simulado,
 * sem chamada externa) e {@code asaas}.
 */
public interface PaymentGateway {

    /** Nome gravado na assinatura ("DEMO" / "ASAAS"). */
    String name();

    /** Cadastra o personal como cliente no provedor e devolve o id dele lá. */
    String createCustomer(User trainer);

    /** Cria a assinatura mensal; a 1ª cobrança vence em {@code firstDueDate}. */
    GatewaySubscription createSubscription(String customerId, BillingPlan plan, LocalDate firstDueDate,
                                           String externalReference);

    /** Troca o valor da assinatura (mudança de plano), inclusive cobranças em aberto. */
    void updateSubscriptionPlan(String subscriptionId, BillingPlan plan);

    void cancelSubscription(String subscriptionId);

    /** Cobrança avulsa (pacote de IA) que vence em {@code dueDate}. */
    GatewayCharge createCharge(String customerId, int priceCents, String description, LocalDate dueDate,
                               String externalReference);

    /**
     * @param id          id da assinatura no provedor
     * @param checkoutUrl página onde o personal paga a 1ª cobrança (Pix, boleto
     *                    ou cartão); caminho relativo do painel no modo demo
     */
    record GatewaySubscription(String id, String checkoutUrl) {}

    /** @param id id da cobrança no provedor; checkoutUrl como em {@link GatewaySubscription} */
    record GatewayCharge(String id, String checkoutUrl) {}
}
