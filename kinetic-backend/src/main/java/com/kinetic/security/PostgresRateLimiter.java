package com.kinetic.security;

import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Contadores na tabela rate_limit_counters (V48): todas as cópias do backend somam no
 * mesmo contador, e um deploy não zera os limites.
 *
 * As janelas são alinhadas ao relógio (o minuto 12:05 vai de 12:05:00 a 12:05:59), não
 * ao primeiro pedido: na virada, um cliente pode somar até 2× o limite em poucos segundos.
 */
@Component
public class PostgresRateLimiter implements RateLimiter {

    private static final String INCREMENT = """
            INSERT INTO rate_limit_counters (key, window_end, count) VALUES (?, ?, 1)
            ON CONFLICT (key, window_end) DO UPDATE SET count = rate_limit_counters.count + 1
            RETURNING count""";

    private final JdbcTemplate jdbc;

    public PostgresRateLimiter(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public long acquire(String key, int limit, long windowMs) {
        long now = System.currentTimeMillis();
        long windowEnd = now - Math.floorMod(now, windowMs) + windowMs;
        Integer count = jdbc.queryForObject(INCREMENT, Integer.class, key, windowEnd);
        return count != null && count <= limit ? 0 : Math.max(1, windowEnd - now);
    }

    @Scheduled(cron = "0 */10 * * * *")
    @SchedulerLock(name = "purgeRateLimitCounters")
    public void purgeExpired() {
        jdbc.update("DELETE FROM rate_limit_counters WHERE window_end < ?", System.currentTimeMillis());
    }
}
