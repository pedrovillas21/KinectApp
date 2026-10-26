package com.kinetic.security;

/** Contador de janela fixa por chave. Cada chave tem a própria janela, definida por quem chama. */
public interface RateLimiter {

    /**
     * Conta um pedido para {@code key}.
     *
     * @return 0 se está dentro do limite; senão, quantos ms faltam para a janela virar
     */
    long acquire(String key, int limit, long windowMs);
}
