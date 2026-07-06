package com.kinetic.services;

import com.kinetic.repositories.SocialPostRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class OrphanMediaCleanupService {

    private static final Logger log = LoggerFactory.getLogger(OrphanMediaCleanupService.class);
    private static final List<String> FOLDERS = List.of("posts", "stories");

    private final StorageService storageService;
    private final SocialPostRepository socialPostRepository;

    @Value("${social.media.cleanup.grace-hours:24}")
    private long graceHours;

    @Value("${social.media.cleanup.dry-run:true}")
    private boolean dryRun;

    /**
     * Varre o bucket diariamente às 05:00 e apaga objetos sem linha correspondente
     * em social_posts que já ultrapassaram o grace period. A leitura do banco é isolada
     * em {@link #findAllImageUrls()}, que abre/fecha sua própria transação, para que a
     * conexão JDBC não fique presa durante as chamadas HTTP (list/delete) ao Storage.
     */
    @Scheduled(cron = "0 0 5 * * *")
    public void cleanOrphanMedia() {
        List<String> imageUrls = findAllImageUrls();
        Set<String> knownKeys = new HashSet<>();
        for (String url : imageUrls) {
            String key = storageService.keyFromPublicUrl(url);
            if (key != null) knownKeys.add(key);
        }

        log.info("OrphanMediaCleanupService: {} URL(s) conhecida(s) no banco.", knownKeys.size());

        Instant cutoff = Instant.now().minus(graceHours, ChronoUnit.HOURS);
        int orphanCount = 0;

        for (String folder : FOLDERS) {
            List<StorageService.RemoteObject> objects = storageService.list(folder);
            log.info("OrphanMediaCleanupService: {} objeto(s) encontrado(s) em '{}'.",
                    objects.size(), folder);

            for (StorageService.RemoteObject obj : objects) {
                if (obj.createdAt() == null) continue;
                if (knownKeys.contains(obj.key())) continue;
                if (!obj.createdAt().isBefore(cutoff)) continue;

                orphanCount++;
                if (dryRun) {
                    log.info("[dry-run] removeria: {}", obj.key());
                } else {
                    storageService.deleteByKey(obj.key());
                    log.info("OrphanMediaCleanupService: removido órfão '{}'.", obj.key());
                }
            }
        }

        if (dryRun) {
            log.info("[dry-run] removeria {} mídia(s) órfã(s).", orphanCount);
        } else {
            log.info("OrphanMediaCleanupService: {} mídia(s) órfã(s) removida(s).", orphanCount);
        }
    }

    // Repositórios Spring Data JPA já abrem uma transação readOnly própria para cada
    // método find*/get*, então isolar a chamada aqui é suficiente para que a conexão
    // JDBC seja devolvida ao pool assim que a query termina, antes do loop de HTTP.
    private List<String> findAllImageUrls() {
        return socialPostRepository.findAllImageUrls();
    }
}
