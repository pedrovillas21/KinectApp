package com.kinetic.enums;

/**
 * TRIAL: teste grátis; PENDENTE: escolheu o plano e falta pagar a 1ª cobrança;
 * ATIVA: em dia; ATRASADA: cobrança vencida (mantém o acesso, com aviso);
 * CANCELADA: vale até o fim do período já pago.
 */
public enum SubscriptionStatus {
    TRIAL,
    PENDENTE,
    ATIVA,
    ATRASADA,
    CANCELADA
}
