package com.kinetic.billing;

import java.time.LocalDate;

/**
 * Evento do provedor já traduzido para o que importa ao Kinetic.
 *
 * @param eventId        id do evento no provedor (idempotência); pode ser nulo
 * @param type           o que aconteceu
 * @param subscriptionId id da assinatura no provedor
 * @param dueDate        vencimento da cobrança paga/atrasada (nulo em eventos de assinatura)
 */
public record GatewayEvent(String eventId, Type type, String subscriptionId, LocalDate dueDate) {

    public enum Type {
        /** Cobrança paga (Pix/boleto compensado ou cartão aprovado). */
        PAYMENT_PAID,
        PAYMENT_OVERDUE,
        /** Assinatura removida/inativada no provedor. */
        SUBSCRIPTION_ENDED,
        /** Evento que não muda nada para o Kinetic. */
        IGNORED
    }
}
