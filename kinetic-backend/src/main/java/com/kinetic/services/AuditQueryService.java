package com.kinetic.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kinetic.billing.PaymentGateway;
import com.kinetic.dtos.AuditDTOs;
import com.kinetic.dtos.AuditDTOs.Party;
import com.kinetic.enums.AuditAction;
import com.kinetic.enums.AuditCategory;
import com.kinetic.security.Pseudonymizer;
import com.kinetic.utils.AppTime;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Leituras da Auditoria do painel ROOT. Tudo por JdbcTemplate (as tabelas da V49/V54 não
 * têm entidade). Nenhuma resposta traz e-mail, CPF ou dado de saúde: nomes saem de um
 * JOIN e conta que não existe mais vem só com o id.
 */
@Service
@RequiredArgsConstructor
public class AuditQueryService {

    /** Linhas de access_logs por busca; o período inteiro cabe em quase todo caso. */
    static final int ACCESS_LOG_LIMIT = 1000;
    /** Pedido de titular "vencendo": prazo nos próximos N dias. */
    static final int DUE_SOON_DAYS = 3;

    private static final TypeReference<Map<String, Object>> JSON_MAP = new TypeReference<>() {};

    private final JdbcTemplate jdbc;
    private final ObjectMapper objectMapper;
    private final Pseudonymizer pseudonymizer;
    private final AuditService auditService;
    private final TermsService termsService;
    private final PaymentGateway gateway;

    public record EventFilter(AuditCategory category, AuditAction action, UUID actorId, UUID targetId,
                              UUID companyId, LocalDate from, LocalDate to) {}

    // ── Eventos ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<AuditDTOs.Event> events(EventFilter f, Pageable pageable) {
        StringBuilder where = new StringBuilder(" WHERE TRUE");
        List<Object> args = new ArrayList<>();
        if (f.category() != null) {
            where.append(" AND e.category = ?");
            args.add(f.category().name());
        }
        if (f.action() != null) {
            where.append(" AND e.action = ?");
            args.add(f.action().name());
        }
        if (f.actorId() != null) {
            where.append(" AND e.actor_id = ?");
            args.add(f.actorId());
        }
        if (f.targetId() != null) {
            where.append(" AND e.target_id = ?");
            args.add(f.targetId());
        }
        if (f.companyId() != null) {
            where.append(" AND e.company_id = ?");
            args.add(f.companyId());
        }
        appendPeriod(where, args, "e.occurred_at", f.from(), f.to());

        Long total = jdbc.queryForObject("SELECT count(*) FROM audit_events e" + where, Long.class, args.toArray());
        List<Object> pageArgs = new ArrayList<>(args);
        pageArgs.add(pageable.getPageSize());
        pageArgs.add(pageable.getOffset());
        List<AuditDTOs.Event> content = jdbc.query("""
                SELECT e.*, a.nome AS actor_name, tu.nome AS target_user_name, tc.nome AS target_company_name,
                       c.nome AS company_name
                FROM audit_events e
                LEFT JOIN users a ON a.id = e.actor_id
                LEFT JOIN users tu ON e.target_type = 'USER' AND tu.id = e.target_id
                LEFT JOIN companies tc ON e.target_type = 'COMPANY' AND tc.id = e.target_id
                LEFT JOIN companies c ON c.id = e.company_id""" + where
                        + " ORDER BY e.occurred_at DESC, e.id DESC LIMIT ? OFFSET ?",
                this::toEvent, pageArgs.toArray());
        return new PageImpl<>(content, pageable, total == null ? 0 : total);
    }

    private AuditDTOs.Event toEvent(ResultSet rs, int row) throws SQLException {
        AuditCategory category = AuditCategory.valueOf(rs.getString("category"));
        String targetType = rs.getString("target_type");
        String targetName = switch (targetType == null ? "" : targetType) {
            case "USER" -> rs.getString("target_user_name");
            case "COMPANY" -> rs.getString("target_company_name");
            default -> null;
        };
        boolean resolvable = "USER".equals(targetType) || "COMPANY".equals(targetType);
        UUID targetId = rs.getObject("target_id", UUID.class);
        return new AuditDTOs.Event(
                rs.getLong("id"),
                rs.getTimestamp("occurred_at").toInstant(),
                category,
                rs.getString("action"),
                party(rs.getObject("actor_id", UUID.class), rs.getString("actor_name")),
                rs.getString("actor_role"),
                targetType,
                targetId == null ? null : new Party(targetId, targetName, resolvable && targetName == null),
                party(rs.getObject("company_id", UUID.class), rs.getString("company_name")),
                // IP é dado pessoal: só aparece onde serve à investigação (tentativas de acesso).
                category == AuditCategory.SECURITY ? rs.getString("ip") : null,
                rs.getString("reason"),
                parseJson(rs.getString("details")));
    }

    // ── Registros de acesso (Marco Civil art. 15) ───────────────────────────

    /**
     * Ordem judicial ou pedido do titular. Acha a conta pelo e-mail, ou pelo pseudônimo em
     * deleted_accounts quando ela já foi excluída. A própria consulta vira evento, com o motivo.
     */
    @Transactional
    public AuditDTOs.AccessLogResult searchAccessLogs(AuditDTOs.AccessLogSearch req) {
        if (req.to().isBefore(req.from())) {
            throw new IllegalArgumentException("O fim do período vem antes do início.");
        }
        UUID userId = jdbc.query("SELECT id FROM users WHERE lower(email) = lower(?)",
                rs -> rs.next() ? rs.getObject(1, UUID.class) : null, req.email().trim());
        boolean deleted = false;
        if (userId == null) {
            userId = jdbc.query("SELECT user_id FROM deleted_accounts WHERE email_hash = ? ORDER BY deleted_at DESC LIMIT 1",
                    rs -> rs.next() ? rs.getObject(1, UUID.class) : null, pseudonymizer.email(req.email()));
            deleted = userId != null;
        }
        if (userId == null) {
            throw new EntityNotFoundException("Nenhuma conta, ativa ou excluída, com este e-mail.");
        }

        List<AuditDTOs.AccessLog> logs = jdbc.query("""
                        SELECT accessed_at, ip, event FROM access_logs
                        WHERE user_id = ? AND accessed_at >= ? AND accessed_at < ?
                        ORDER BY accessed_at DESC LIMIT ?""",
                (rs, i) -> new AuditDTOs.AccessLog(rs.getTimestamp("accessed_at").toInstant(), rs.getString("ip"),
                        rs.getString("event")),
                userId, startOf(req.from()), startOf(req.to().plusDays(1)), ACCESS_LOG_LIMIT + 1);
        boolean truncated = logs.size() > ACCESS_LOG_LIMIT;
        if (truncated) {
            logs = logs.subList(0, ACCESS_LOG_LIMIT);
        }

        auditService.record(AuditAction.ACCESS_LOGS_VIEWED, userId, null, req.reason(), Map.of(
                "from", req.from().toString(), "to", req.to().toString(),
                "deletedAccount", deleted, "rows", logs.size()));
        return new AuditDTOs.AccessLogResult(userId, deleted, logs, truncated);
    }

    // ── LGPD ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public AuditDTOs.Lgpd lgpd(LocalDate from, LocalDate to, Pageable pageable) {
        StringBuilder period = new StringBuilder(" WHERE TRUE");
        List<Object> args = new ArrayList<>();
        appendPeriod(period, args, "d.deleted_at", from, to);

        AuditDTOs.Deletions deletions = jdbc.queryForObject("""
                SELECT count(*) FILTER (WHERE d.deleted_by = 'TITULAR') AS titular,
                       count(*) FILTER (WHERE d.deleted_by = 'ADMIN') AS admin,
                       count(*) FILTER (WHERE d.blocked) AS blocked
                FROM deleted_accounts d""" + period,
                (rs, i) -> new AuditDTOs.Deletions(rs.getLong("titular"), rs.getLong("admin"), rs.getLong("blocked")),
                args.toArray());

        // ROOT é a operação do Kinetic, não um titular: fica fora da conta (como no TermsService).
        String version = termsService.currentVersion();
        AuditDTOs.Terms terms = jdbc.queryForObject("""
                SELECT count(*) FILTER (WHERE terms_version = ?) AS accepted,
                       count(*) FILTER (WHERE terms_version IS DISTINCT FROM ?) AS pending
                FROM users WHERE role <> 'ROOT'""",
                (rs, i) -> new AuditDTOs.Terms(version, rs.getLong("accepted"), rs.getLong("pending")),
                version, version);

        AuditDTOs.LastPurge lastPurge = jdbc.query("""
                SELECT occurred_at, details FROM audit_events
                WHERE category = 'LGPD' AND action = 'RETENTION_PURGED'
                ORDER BY occurred_at DESC LIMIT 1""",
                rs -> rs.next()
                        ? new AuditDTOs.LastPurge(rs.getTimestamp("occurred_at").toInstant(), parseJson(rs.getString("details")))
                        : null);

        AuditDTOs.RequestCounts requests = jdbc.queryForObject("""
                SELECT count(*) FILTER (WHERE status = 'ABERTO') AS open,
                       count(*) FILTER (WHERE status = 'ABERTO' AND due_at BETWEEN CURRENT_DATE AND CURRENT_DATE + ?) AS due_soon,
                       count(*) FILTER (WHERE status = 'ABERTO' AND due_at < CURRENT_DATE) AS overdue
                FROM data_subject_requests""",
                (rs, i) -> new AuditDTOs.RequestCounts(rs.getLong("open"), rs.getLong("due_soon"), rs.getLong("overdue")),
                DUE_SOON_DAYS);

        long total = deletions == null ? 0 : deletions.byTitular() + deletions.byAdmin();
        List<Object> pageArgs = new ArrayList<>(args);
        pageArgs.add(pageable.getPageSize());
        pageArgs.add(pageable.getOffset());
        // Quem excluiu (ROOT) sai do evento USER_DELETED_BY_ADMIN: deleted_accounts só guarda "ADMIN".
        List<AuditDTOs.DeletedAccount> accounts = jdbc.query("""
                SELECT d.user_id, d.role, d.deleted_by, d.blocked, d.deleted_at, d.retain_until,
                       adm.actor_id AS admin_id, au.nome AS admin_name
                FROM deleted_accounts d
                LEFT JOIN LATERAL (
                    SELECT actor_id FROM audit_events
                    WHERE target_id = d.user_id AND action = 'USER_DELETED_BY_ADMIN'
                    ORDER BY occurred_at DESC LIMIT 1
                ) adm ON d.deleted_by = 'ADMIN'
                LEFT JOIN users au ON au.id = adm.actor_id""" + period
                        + " ORDER BY d.deleted_at DESC LIMIT ? OFFSET ?",
                (rs, i) -> new AuditDTOs.DeletedAccount(
                        rs.getObject("user_id", UUID.class),
                        rs.getString("role"),
                        rs.getString("deleted_by"),
                        party(rs.getObject("admin_id", UUID.class), rs.getString("admin_name")),
                        rs.getBoolean("blocked"),
                        rs.getTimestamp("deleted_at").toInstant(),
                        rs.getDate("retain_until").toLocalDate()),
                pageArgs.toArray());

        return new AuditDTOs.Lgpd(deletions, terms, lastPurge, requests, new PageImpl<>(accounts, pageable, total));
    }

    // ── Fichas por IA ───────────────────────────────────────────────────────

    /** Só metadados da aprovação: prompt, options e ai_output têm condições médicas e nunca saem daqui. */
    @Transactional(readOnly = true)
    public AuditDTOs.Ai ai(LocalDate from, LocalDate to, Pageable pageable) {
        StringBuilder created = new StringBuilder(" WHERE TRUE");
        List<Object> createdArgs = new ArrayList<>();
        appendPeriod(created, createdArgs, "created_at", from, to);
        long[] counts = jdbc.queryForObject(
                "SELECT count(*) AS previews, count(*) FILTER (WHERE status = 'APPROVED') AS approved "
                        + "FROM ai_plan_generations" + created,
                (rs, i) -> new long[]{rs.getLong("previews"), rs.getLong("approved")}, createdArgs.toArray());

        StringBuilder approved = new StringBuilder(" WHERE g.status = 'APPROVED'");
        List<Object> args = new ArrayList<>();
        appendPeriod(approved, args, "g.approved_at", from, to);
        Long total = jdbc.queryForObject("SELECT count(*) FROM ai_plan_generations g" + approved, Long.class,
                args.toArray());
        List<Object> pageArgs = new ArrayList<>(args);
        pageArgs.add(pageable.getPageSize());
        pageArgs.add(pageable.getOffset());
        // Conta excluída: nome e CREF do personal ficam na própria geração (V49); o aluno, só como pseudônimo.
        List<AuditDTOs.AiApproval> approvals = jdbc.query("""
                SELECT g.id, g.approved_at, g.model, g.replaced_current, g.trainer_id, g.student_id,
                       COALESCE(t.nome, g.trainer_name) AS trainer_name,
                       COALESCE(tp.cref, g.trainer_cref) AS trainer_cref,
                       s.nome AS student_name
                FROM ai_plan_generations g
                LEFT JOIN users t ON t.id = g.trainer_id
                LEFT JOIN trainer_profiles tp ON tp.user_id = g.trainer_id
                LEFT JOIN users s ON s.id = g.student_id""" + approved
                        + " ORDER BY g.approved_at DESC LIMIT ? OFFSET ?",
                (rs, i) -> {
                    UUID trainerId = rs.getObject("trainer_id", UUID.class);
                    UUID studentId = rs.getObject("student_id", UUID.class);
                    return new AuditDTOs.AiApproval(
                            rs.getObject("id", UUID.class),
                            rs.getTimestamp("approved_at").toInstant(),
                            new Party(trainerId, rs.getString("trainer_name"), trainerId == null),
                            rs.getString("trainer_cref"),
                            rs.getString("model"),
                            (Boolean) rs.getObject("replaced_current"),
                            new Party(studentId, studentId == null ? null : rs.getString("student_name"), studentId == null));
                },
                pageArgs.toArray());
        return new AuditDTOs.Ai(counts == null ? 0 : counts[0], counts == null ? 0 : counts[1],
                new PageImpl<>(approvals, pageable, total == null ? 0 : total));
    }

    // ── Cobrança ────────────────────────────────────────────────────────────

    public AuditDTOs.BillingGateway billingGateway() {
        return new AuditDTOs.BillingGateway(gateway.name(), "DEMO".equals(gateway.name()));
    }

    // ── Internos ────────────────────────────────────────────────────────────

    /** Período em dias do calendário do Brasil: de 00:00 de {@code from} até o fim de {@code to}. */
    static void appendPeriod(StringBuilder where, List<Object> args, String column, LocalDate from, LocalDate to) {
        if (from != null) {
            where.append(" AND ").append(column).append(" >= ?");
            args.add(startOf(from));
        }
        if (to != null) {
            where.append(" AND ").append(column).append(" < ?");
            args.add(startOf(to.plusDays(1)));
        }
    }

    private static Timestamp startOf(LocalDate day) {
        return Timestamp.from(day.atStartOfDay(AppTime.ZONE).toInstant());
    }

    /** Conta ou empresa: sem nome no JOIN = não existe mais. */
    static Party party(UUID id, String name) {
        return id == null ? null : new Party(id, name, name == null);
    }

    private Map<String, Object> parseJson(String json) {
        if (json == null) {
            return null;
        }
        try {
            return objectMapper.readValue(json, JSON_MAP);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Detalhes de auditoria ilegíveis", e);
        }
    }
}
