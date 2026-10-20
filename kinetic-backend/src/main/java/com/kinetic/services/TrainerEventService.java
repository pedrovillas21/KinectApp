package com.kinetic.services;

import com.kinetic.enums.TrainerLinkStatus;
import com.kinetic.repositories.TrainerClientRepository;
import com.kinetic.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Avisos em tempo real para o painel do personal (GET /api/trainer/events, SSE).
 * O evento só diz "o que mudou" ({type, studentId}); o painel refaz as buscas
 * da tela aberta. Nada de dado do aluno trafega por aqui.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TrainerEventService {

    /** Conexões recicladas a cada 30 min; o painel reconecta e recarrega a tela. */
    private static final long EMITTER_TIMEOUT_MS = 30 * 60_000L;

    public record TrainerEvent(String type, UUID studentId) {}

    private final UserRepository userRepository;
    private final TrainerClientRepository trainerClientRepository;

    // shortcut: conexões em memória, só vale com UMA instância do backend; ao escalar
    // horizontalmente, distribuir os eventos por Postgres LISTEN/NOTIFY ou Redis pub/sub.
    private final Map<UUID, Set<SseEmitter>> emitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(String trainerEmail) {
        UUID trainerId = userRepository.getByEmailOrThrow(trainerEmail).getId();
        SseEmitter emitter = new SseEmitter(EMITTER_TIMEOUT_MS);
        emitters.computeIfAbsent(trainerId, k -> ConcurrentHashMap.newKeySet()).add(emitter);
        Runnable remove = () -> emitters.computeIfPresent(trainerId, (k, set) -> {
            set.remove(emitter);
            return set.isEmpty() ? null : set;
        });
        emitter.onCompletion(remove);
        emitter.onTimeout(remove);
        emitter.onError(e -> remove.run());
        // Primeira linha já sai: o cliente sabe que conectou (e proxies liberam o stream).
        send(trainerId, emitter, SseEmitter.event().comment("ok"));
        return emitter;
    }

    /** Algo do aluno mudou (treino, peso, protocolo, vínculo): avisa o personal ATIVO dele. */
    public void studentChanged(String studentEmail) {
        if (emitters.isEmpty()) return; // ninguém conectado: nem consulta o banco
        userRepository.findByEmail(studentEmail).ifPresent(student ->
                trainerClientRepository.findByStudentIdAndStatus(student.getId(), TrainerLinkStatus.ATIVO)
                        .ifPresent(link -> publish(link.getTrainer().getId(), "student", student.getId())));
    }

    /** Publica só depois do commit, para o painel não reler o dado antigo. */
    public void publishAfterCommit(UUID trainerId, String type, UUID studentId) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            publish(trainerId, type, studentId);
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                publish(trainerId, type, studentId);
            }
        });
    }

    public void publish(UUID trainerId, String type, UUID studentId) {
        Set<SseEmitter> set = emitters.get(trainerId);
        if (set == null) return;
        for (SseEmitter emitter : set) {
            send(trainerId, emitter, SseEmitter.event().name("change").data(new TrainerEvent(type, studentId)));
        }
    }

    /** Comentário a cada 25s: mantém proxies sem cortar a conexão ociosa e derruba as mortas. */
    @Scheduled(fixedRate = 25_000)
    public void heartbeat() {
        emitters.forEach((trainerId, set) -> set.forEach(e -> send(trainerId, e, SseEmitter.event().comment("ping"))));
    }

    private void send(UUID trainerId, SseEmitter emitter, SseEmitter.SseEventBuilder event) {
        try {
            emitter.send(event);
        } catch (IOException | IllegalStateException e) {
            // Cliente foi embora: tira da lista; o painel reconecta sozinho.
            log.debug("SSE do personal {} encerrado: {}", trainerId, e.getMessage());
            emitter.completeWithError(e);
            emitters.computeIfPresent(trainerId, (k, set) -> {
                set.remove(emitter);
                return set.isEmpty() ? null : set;
            });
        }
    }
}
