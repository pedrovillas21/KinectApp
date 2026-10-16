package com.kinetic.billing;

import com.kinetic.enums.BillingPlan;
import com.kinetic.models.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Gateway de demonstração (padrão enquanto não há conta no Asaas): não chama
 * nada externo nem cobra ninguém. O "pagamento" é simulado pelo painel na
 * página /assinatura/checkout-demo, que chama o endpoint de confirmação demo.
 */
@Component
@ConditionalOnProperty(name = "billing.gateway", havingValue = "demo", matchIfMissing = true)
public class DemoPaymentGateway implements PaymentGateway {

    private static final Logger log = LoggerFactory.getLogger(DemoPaymentGateway.class);

    /** Rota do painel que simula o checkout. */
    static final String CHECKOUT_PATH = "/assinatura/checkout-demo";

    @Override
    public String name() {
        return "DEMO";
    }

    @Override
    public String createCustomer(User trainer) {
        return "demo_cus_" + UUID.randomUUID();
    }

    @Override
    public GatewaySubscription createSubscription(String customerId, BillingPlan plan, LocalDate firstDueDate,
                                                  String externalReference) {
        String id = "demo_sub_" + UUID.randomUUID();
        log.info("[billing-demo] assinatura {} criada no plano {} (nenhuma cobrança real).", id, plan);
        return new GatewaySubscription(id, CHECKOUT_PATH);
    }

    @Override
    public void updateSubscriptionPlan(String subscriptionId, BillingPlan plan) {
        log.info("[billing-demo] assinatura {} mudou para o plano {}.", subscriptionId, plan);
    }

    @Override
    public void cancelSubscription(String subscriptionId) {
        log.info("[billing-demo] assinatura {} cancelada.", subscriptionId);
    }
}
