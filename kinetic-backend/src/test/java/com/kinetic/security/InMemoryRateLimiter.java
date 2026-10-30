package com.kinetic.security;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.LongSupplier;

/** {@link RateLimiter} em memória com relógio controlado, para os testes sem banco. */
public class InMemoryRateLimiter implements RateLimiter {

    private record Window(long start, long lengthMs, int count) {}

    private final Map<String, Window> windows = new ConcurrentHashMap<>();
    private final LongSupplier clock;

    public InMemoryRateLimiter(LongSupplier clock) {
        this.clock = clock;
    }

    @Override
    public long acquire(String key, int limit, long windowMs) {
        long now = clock.getAsLong();
        Window window = windows.compute(key, (k, current) ->
                current == null || now - current.start() >= current.lengthMs()
                        ? new Window(now, windowMs, 1)
                        : new Window(current.start(), current.lengthMs(), current.count() + 1));
        return window.count() <= limit ? 0 : Math.max(1, window.start() + window.lengthMs() - now);
    }
}
