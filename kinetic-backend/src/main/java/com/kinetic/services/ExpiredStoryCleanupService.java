package com.kinetic.services;

import com.kinetic.models.SocialPost;
import com.kinetic.repositories.SocialPostRepository;
import lombok.RequiredArgsConstructor;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Apaga de vez as stories que passaram das 24h (linha + foto). A leitura já as esconde
 * (findActiveStories), mas sem isto a foto ficava guardada para sempre: o job de mídia
 * órfã a considerava "conhecida" enquanto a linha existisse (e roda em dry-run por padrão).
 */
@Service
@RequiredArgsConstructor
public class ExpiredStoryCleanupService {

    private static final Logger log = LoggerFactory.getLogger(ExpiredStoryCleanupService.class);
    static final int BATCH_SIZE = 500;

    private final SocialPostRepository socialPostRepository;
    private final StorageService storageService;

    /**
     * De hora em hora (minuto 15, fora do pico dos outros jobs). Sem @Transactional de
     * propósito: a busca e o delete abrem transações curtas próprias, e as chamadas HTTP
     * ao Storage acontecem depois do commit, sem segurar conexão JDBC. Linha apagada
     * antes da foto: se o Storage falhar, sobra só um arquivo órfão (o job de órfãos
     * cobre), nunca uma linha apontando para foto inexistente.
     */
    @Scheduled(cron = "0 15 * * * *")
    @SchedulerLock(name = "purgeExpiredStories", lockAtMostFor = "PT30M")
    public void purgeExpiredStories() {
        // shortcut: um lote de até 500 por execução; volume maior escoa nas horas seguintes.
        List<SocialPost> expired = socialPostRepository.findByKindAndExpiresAtBefore(
                "STORY", LocalDateTime.now(), PageRequest.of(0, BATCH_SIZE));
        if (expired.isEmpty()) return;

        socialPostRepository.deleteAllByIdInBatch(expired.stream().map(SocialPost::getId).toList());
        for (SocialPost story : expired) {
            if (story.getImageUrl() != null) storageService.delete(story.getImageUrl());
        }
        log.info("ExpiredStoryCleanupService: {} story(s) vencida(s) removida(s).", expired.size());
    }
}
