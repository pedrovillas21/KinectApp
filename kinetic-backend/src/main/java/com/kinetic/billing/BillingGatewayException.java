package com.kinetic.billing;

/** Falha ao falar com o provedor de pagamento. Mapeada para HTTP 502. */
public class BillingGatewayException extends RuntimeException {
    public BillingGatewayException(String message) {
        super(message);
    }
}
