package com.kinetic.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kinetic.enums.AuditAction;
import com.kinetic.models.User;
import com.kinetic.repositories.UserRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Único ponto de gravação da trilha de auditoria (audit_events, V54). Quem chama diz só
 * o quê, sobre quem e por quê; o autor sai da sessão e o IP da requisição.
 *
 * <p>Grava na transação de quem chama: se a ação volta atrás, o registro some junto. A
 * exceção, decidida aqui e não por quem chama, é a falha de segurança
 * ({@link AuditAction#survivesRollback()}), que grava numa transação própria. Por isso quem
 * chama não pode estar numa transação readOnly (o INSERT seria recusado): uma transação nova
 * para cada leitura seguraria duas conexões por requisição e esgotaria o pool sob carga.
 *
 * <p>Nunca vai para {@code details}: e-mail em claro, senha, código ou token.
 */
@Service
public class AuditService {

    private static final String INSERT = """
            INSERT INTO audit_events (category, action, actor_id, actor_role, target_type, target_id,
                company_id, ip, reason, details, retain_until)
            SELECT ?, ?, ?::uuid, ?, ?, ?::uuid, ?::uuid, ?, ?, ?::jsonb,
                (CURRENT_DATE + make_interval(months => ?))::date""";

    // Janela calculada no banco (clock_timestamp), como o resto da linha. A chave é autor + alvo +
    // ação + details.kind (tipo do dado de saúde) + details.emailHash (login com e-mail sem conta).
    private static final String UNLESS_SEEN_THIS_HOUR = """
            WHERE NOT EXISTS (SELECT 1 FROM audit_events
                              WHERE category = '%s' AND action = ? AND %s AND %s
                                AND details ->> 'kind' IS NOT DISTINCT FROM ?
                                AND details ->> 'emailHash' IS NOT DISTINCT FROM ?
                                AND occurred_at >= clock_timestamp() - INTERVAL '1 hour')""";

    private final JdbcTemplate jdbc;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final TransactionTemplate newTransaction;

    public AuditService(JdbcTemplate jdbc, UserRepository userRepository, ObjectMapper objectMapper,
                        PlatformTransactionManager transactionManager) {
        this.jdbc = jdbc;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
        this.newTransaction = new TransactionTemplate(transactionManager);
        this.newTransaction.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    /**
     * @param targetId  quem ou o que sofreu a ação (tipo em {@link AuditAction#target()}); pode ser nulo
     * @param companyId empresa ou filial envolvida, para o filtro do painel; pode ser nulo
     * @param reason    motivo informado pelo ROOT; nulo nas demais ações
     * @param details   dados extras sem PII (status anterior, contagens...); pode ser nulo
     */
    public void record(AuditAction action, UUID targetId, UUID companyId, String reason, Map<String, Object> details) {
        User actor = currentActor();
        Object[] row = {
                action.category().name(), action.name(),
                actor == null ? null : actor.getId(), actor == null ? null : actor.getRole().name(),
                targetId == null || action.target() == AuditAction.Target.NONE ? null : action.target().name(),
                targetId, companyId, currentIp(),
                reason == null || reason.isBlank() ? null : reason.trim(),
                toJson(details), action.category().retentionMonths()};

        Runnable insert = action.hourly()
                ? () -> insertUnlessSeenThisHour(action, actor, targetId, details, row)
                : () -> jdbc.update(INSERT, row);

        if (action.survivesRollback()) {
            newTransaction.executeWithoutResult(status -> insert.run());
        } else {
            insert.run();
        }
    }

    /**
     * Categoria em literal (vem do enum, não de entrada): assim o índice parcial de HEALTH vale
     * também no plano genérico do prepared statement. Autor/alvo nulos viram IS NULL, que o
     * índice não precisa cobrir (só o login barrado de e-mail sem conta cai nesse caso).
     */
    private void insertUnlessSeenThisHour(AuditAction action, User actor, UUID targetId,
                                          Map<String, Object> details, Object[] row) {
        List<Object> args = new ArrayList<>(Arrays.asList(row));
        args.add(action.name());
        if (actor != null) {
            args.add(actor.getId());
        }
        if (targetId != null) {
            args.add(targetId);
        }
        args.add(detail(details, "kind"));
        args.add(detail(details, "emailHash"));
        String unless = UNLESS_SEEN_THIS_HOUR.formatted(action.category().name(),
                actor == null ? "actor_id IS NULL" : "actor_id = ?::uuid",
                targetId == null ? "target_id IS NULL" : "target_id = ?::uuid");
        jdbc.update(INSERT + "\n" + unless, args.toArray());
    }

    /** Conta logada nesta requisição; nulo sem login (login, 2FA, recuperação, webhook, agendador). */
    private User currentActor() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            return null;
        }
        return userRepository.findByEmail(auth.getName()).orElse(null);
    }

    /** getRemoteAddr já é o IP real atrás do túnel (server.forward-headers-strategy=native). */
    private static String currentIp() {
        return RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attrs
                ? attrs.getRequest().getRemoteAddr()
                : null;
    }

    private String toJson(Map<String, Object> details) {
        if (details == null || details.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(details);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Detalhes de auditoria não serializáveis", e);
        }
    }

    private static String detail(Map<String, Object> details, String key) {
        Object value = details == null ? null : details.get(key);
        return value == null ? null : value.toString();
    }
}
