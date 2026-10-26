package com.kinetic.services;

import com.kinetic.enums.TrainerLinkStatus;
import com.kinetic.repositories.TrainerClientRepository;
import com.kinetic.repositories.UserRepository;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;
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
 *
 * Com 2+ cópias do backend, o aluno pode ser atendido por uma cópia e o painel do
 * personal estar conectado em outra. Por isso o evento passa pela tabela trainer_events
 * (V48): quem publica grava, e cada cópia lê os novos a cada segundo e entrega aos
 * painéis conectados nela.
 */
@Slf4j
@Service
public class TrainerEventService {

    /** Conexões recicladas a cada 30 min; o painel reconecta e recarrega a tela. */
    private static final long EMITTER_TIMEOUT_MS = 30 * 60_000L;

    // Só lê o que tem mais de 1 s: um INSERT de id menor que ainda não commitou seria
    // pulado. Cada INSERT roda numa transação própria e curta, então 1 s sobra.
    private static final String NEW_EVENTS = """
            SELECT id, trainer_id, type, student_id FROM trainer_events
            WHERE id > ? AND created_at < clock_timestamp() - INTERVAL '1 second'
            ORDER BY id""";

    public record TrainerEvent(String type, UUID studentId) {}

    private final UserRepository userRepository;
    private final TrainerClientRepository trainerClientRepository;
    private final JdbcTemplate jdbc;
    private final TransactionTemplate newTransaction;

    /** Conexões SSE abertas nesta cópia. */
    private final Map<UUID, Set<SseEmitter>> emitters = new ConcurrentHashMap<>();

    /** Último evento da tabela já entregue por esta cópia; -1 até a primeira leitura. */
    private long lastEventId = -1;

    public TrainerEventService(UserRepository userRepository,
                               TrainerClientRepository trainerClientRepository,
                               JdbcTemplate jdbc,
                               PlatformTransactionManager transactionManager) {
        this.userRepository = userRepository;
        this.trainerClientRepository = trainerClientRepository;
        this.jdbc = jdbc;
        this.newTransaction = new TransactionTemplate(transactionManager);
        this.newTransaction.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

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
        // Sem atalho por "ninguém conectado aqui": o painel pode estar ligado em outra cópia.
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
        try {
            // Transação própria: no afterCommit a conexão da transação que terminou ainda
            // está presa à thread, e um INSERT nela nunca seria commitado.
            newTransaction.executeWithoutResult(status -> jdbc.update(
                    "INSERT INTO trainer_events (trainer_id, type, student_id) VALUES (?, ?, ?)",
                    trainerId, type, studentId));
        } catch (DataAccessException e) {
            // O aviso é só um atalho para o painel recarregar; não derruba a operação do aluno.
            log.warn("Aviso do painel do personal {} não publicado: {}", trainerId, e.getMessage());
        }
    }

    /** Entrega aos painéis desta cópia os eventos gravados por qualquer cópia. */
    @Scheduled(fixedDelay = 1_000)
    public void deliverNewEvents() {
        if (lastEventId < 0) {
            // Ao subir, começa do fim: os eventos antigos já foram entregues por quem estava no ar.
            Long max = jdbc.queryForObject("SELECT COALESCE(MAX(id), 0) FROM trainer_events", Long.class);
            lastEventId = max == null ? 0 : max;
            return;
        }
        jdbc.query(NEW_EVENTS, rs -> {
            lastEventId = rs.getLong("id");
            deliver(rs.getObject("trainer_id", UUID.class), rs.getString("type"),
                    rs.getObject("student_id", UUID.class));
        }, lastEventId);
    }

    @Scheduled(cron = "0 0 * * * *")
    @SchedulerLock(name = "purgeTrainerEvents")
    public void purgeDeliveredEvents() {
        jdbc.update("DELETE FROM trainer_events WHERE created_at < now() - INTERVAL '1 hour'");
    }

    /** Comentário a cada 25s: mantém proxies sem cortar a conexão ociosa e derruba as mortas. */
    @Scheduled(fixedRate = 25_000)
    public void heartbeat() {
        emitters.forEach((trainerId, set) -> set.forEach(e -> send(trainerId, e, SseEmitter.event().comment("ping"))));
    }

    private void deliver(UUID trainerId, String type, UUID studentId) {
        Set<SseEmitter> set = emitters.get(trainerId);
        if (set == null) return;
        for (SseEmitter emitter : set) {
            send(trainerId, emitter, SseEmitter.event().name("change").data(new TrainerEvent(type, studentId)));
        }
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
