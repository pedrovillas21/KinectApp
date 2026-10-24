package com.kinetic.security;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.LongSupplier;

/**
 * Contador de janela fixa por chave, em memória. Cada chave tem a própria janela
 * (1 minuto, 15 minutos, 1 hora...), definida por quem chama.
 */
// shortcut: em memória e por instância (com N réplicas o limite efetivo vira N×, e zera no deploy); trocar por tabela no Postgres/Redis ao escalar horizontalmente.
public class FixedWindowRateLimiter {

    private static final long SWEEP_INTERVAL_MS = 60_000;

    private record Window(long start, long lengthMs, int count) {}

    private final Map<String, Window> windows = new ConcurrentHashMap<>();
    private final LongSupplier clock;
    private volatile long lastSweep;

    public FixedWindowRateLimiter(LongSupplier clock) {
        this.clock = clock;
        this.lastSweep = clock.getAsLong();
    }

    /**
     * Conta um pedido para {@code key}.
     *
     * @return 0 se está dentro do limite; senão, quantos ms faltam para a janela virar
     */
    public long acquire(String key, int limit, long windowMs) {
        long now = clock.getAsLong();
        evictExpired(now);
        Window window = windows.compute(key, (k, current) ->
                current == null || now - current.start() >= current.lengthMs()
                        ? new Window(now, windowMs, 1)
                        : new Window(current.start(), current.lengthMs(), current.count() + 1));
        return window.count() <= limit ? 0 : Math.max(1, window.start() + window.lengthMs() - now);
    }

    // Memória limitada às chaves com janela em aberto: varre no máximo uma vez por minuto.
    private void evictExpired(long now) {
        if (now - lastSweep < SWEEP_INTERVAL_MS) {
            return;
        }
        lastSweep = now;
        windows.values().removeIf(w -> now - w.start() >= w.lengthMs());
    }

    int trackedKeys() {
        return windows.size();
    }
}
