package com.kinetic.services;

import com.kinetic.repositories.UserRepository;
import com.kinetic.repositories.WorkoutSessionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Mantém em memória a média global de aderência de treinos da comunidade.
 * O valor é recalculado uma vez por dia às 3h via @Scheduled,
 * evitando penalizar a performance do endpoint /stats/summary.
 */
@Service
public class CommunityStatsService {

    private static final Logger log = LoggerFactory.getLogger(CommunityStatsService.class);

    private final UserRepository userRepository;
    private final WorkoutSessionRepository workoutSessionRepository;

    /** Cache thread-safe: volatile garante visibilidade sem lock para leituras. */
    private volatile int cachedAverageEfficiency = 0;

    public CommunityStatsService(UserRepository userRepository,
                                 WorkoutSessionRepository workoutSessionRepository) {
        this.userRepository = userRepository;
        this.workoutSessionRepository = workoutSessionRepository;
    }

    public int getAverageEfficiency() {
        return cachedAverageEfficiency;
    }

    /**
     * Aquece o cache logo após a aplicação ficar pronta, evitando devolver 0
     * para a baseline da comunidade entre o startup e o primeiro tick às 03:00.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void warmCacheOnStartup() {
        log.info("CommunityStatsService: aquecendo cache na inicialização...");
        refreshCache();
    }

    /**
     * Executa todo dia às 03:00 (horário do servidor).
     * Usa enableAsync = false para garantir execução sequencial.
     */
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional(readOnly = true)
    public void refreshCache() {
        log.info("CommunityStatsService: recalculando média global de aderência...");

        LocalDate startOfMonth = LocalDate.now().withDayOfMonth(1);
        LocalDate startOfNextMonth = startOfMonth.plusMonths(1);
        int daysInMonth = startOfMonth.lengthOfMonth();

        // Todos os usuários com frequência configurada
        List<Object[]> userFrequencies = userRepository.findAllUserIdAndFrequency();
        if (userFrequencies.isEmpty()) {
            cachedAverageEfficiency = 0;
            return;
        }

        // Mapa userId → frequência semanal
        Map<UUID, Integer> frequencyMap = new HashMap<>();
        for (Object[] row : userFrequencies) {
            frequencyMap.put((UUID) row[0], (Integer) row[1]);
        }

        // Contagem de sessões por usuário no mês corrente (1 query)
        List<Object[]> sessionCounts = workoutSessionRepository
                .countSessionsPerUserBetween(startOfMonth, startOfNextMonth.minusDays(1));

        Map<UUID, Long> sessionMap = new HashMap<>();
        for (Object[] row : sessionCounts) {
            sessionMap.put((UUID) row[0], (Long) row[1]);
        }

        // Calcula eficiência individual e faz a média
        double totalEfficiency = 0;
        int count = 0;

        for (Map.Entry<UUID, Integer> entry : frequencyMap.entrySet()) {
            UUID userId = entry.getKey();
            int frequency = entry.getValue();
            if (frequency <= 0) continue;

            // Deriva o target do número real de dias do mês (28–31), evitando
            // que meses longos passem de 100% e meses curtos exijam over-performance.
            double target = frequency * (daysInMonth / 7.0);
            if (target <= 0) continue;
            long completed = sessionMap.getOrDefault(userId, 0L);
            double efficiency = Math.min(100, (completed * 100.0) / target);

            totalEfficiency += efficiency;
            count++;
        }

        cachedAverageEfficiency = count > 0 ? (int) Math.round(totalEfficiency / count) : 0;
        log.info("CommunityStatsService: média global = {}%", cachedAverageEfficiency);
    }
}
