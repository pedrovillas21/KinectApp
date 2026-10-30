package com.kinetic.services;

import com.kinetic.dtos.AuditDTOs;
import com.kinetic.enums.AuditAction;
import com.kinetic.repositories.UserRepository;
import com.kinetic.utils.AppTime;
import com.kinetic.utils.Strings;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Date;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Pedidos de titulares (LGPD art. 18) registrados pelo ROOT, com o prazo de resposta de
 * 15 dias (art. 19, II). Abrir e concluir também viram evento LGPD na trilha. O pedido fica
 * 5 anos depois de concluído, como prova do atendimento (RETENCAO-DE-DADOS.md).
 */
@Service
@RequiredArgsConstructor
public class DataSubjectRequestService {

    /** LGPD art. 19, II: resposta completa em até 15 dias do requerimento. */
    static final int RESPONSE_DAYS = 15;
    static final int RETENTION_MONTHS = 60;

    private static final String SELECT = """
            SELECT r.*, u.nome AS subject_name, c.nome AS creator_name
            FROM data_subject_requests r
            LEFT JOIN users u ON u.id = r.user_id
            LEFT JOIN users c ON c.id = r.created_by""";

    private final JdbcTemplate jdbc;
    private final UserRepository userRepository;
    private final AuditService auditService;

    /** Abertos primeiro, pelo prazo; depois os concluídos, do mais recente. */
    @Transactional(readOnly = true)
    public Page<AuditDTOs.DataRequest> list(AuditDTOs.DataRequestStatus status, Pageable pageable) {
        String where = status == null ? "" : " WHERE r.status = ?";
        Object[] filter = status == null ? new Object[0] : new Object[]{status.name()};
        Long total = jdbc.queryForObject("SELECT count(*) FROM data_subject_requests r" + where, Long.class, filter);
        Object[] args = status == null
                ? new Object[]{pageable.getPageSize(), pageable.getOffset()}
                : new Object[]{status.name(), pageable.getPageSize(), pageable.getOffset()};
        List<AuditDTOs.DataRequest> content = jdbc.query(SELECT + where
                        + " ORDER BY (r.status = 'ABERTO') DESC, CASE WHEN r.status = 'ABERTO' THEN r.due_at END ASC,"
                        + " r.completed_at DESC LIMIT ? OFFSET ?",
                (rs, i) -> toDto(rs), args);
        return new PageImpl<>(content, pageable, total == null ? 0 : total);
    }

    @Transactional
    public AuditDTOs.DataRequest open(String rootEmail, AuditDTOs.DataRequestCreate dto) {
        LocalDate today = AppTime.today();
        LocalDate received = dto.receivedAt() == null ? today : dto.receivedAt();
        if (received.isAfter(today)) {
            throw new IllegalArgumentException("A data de recebimento não pode estar no futuro.");
        }
        UUID subjectId = jdbc.query("SELECT id FROM users WHERE lower(email) = lower(?)",
                rs -> rs.next() ? rs.getObject(1, UUID.class) : null, dto.email().trim());
        if (subjectId == null) {
            throw new EntityNotFoundException("Nenhuma conta com este e-mail.");
        }
        UUID creatorId = userRepository.getByEmailOrThrow(rootEmail).getId();
        UUID id = jdbc.queryForObject("""
                        INSERT INTO data_subject_requests (kind, received_at, due_at, user_id, note, created_by, retain_until)
                        VALUES (?, ?, ?::date + ?, ?, ?, ?, (CURRENT_DATE + make_interval(months => ?))::date)
                        RETURNING id""",
                UUID.class, dto.kind().name(), Date.valueOf(received), Date.valueOf(received), RESPONSE_DAYS,
                subjectId, Strings.trimOrNull(dto.note()), creatorId, RETENTION_MONTHS);
        auditService.record(AuditAction.DATA_REQUEST_OPENED, subjectId, null, null,
                Map.of("requestId", id.toString(), "kind", dto.kind().name()));
        return get(id);
    }

    /**
     * Conclui o pedido. Se a conta do titular já saiu (user_id nulo pelo ON DELETE SET NULL),
     * o evento usa o id original, guardado no evento de abertura (audit_events não tem FK).
     */
    @Transactional
    public AuditDTOs.DataRequest complete(UUID id, AuditDTOs.DataRequestComplete dto) {
        List<Map<String, Object>> updated = jdbc.queryForList("""
                        UPDATE data_subject_requests
                        SET status = 'CONCLUIDO', completed_at = CURRENT_DATE, note = COALESCE(?, note),
                            retain_until = (CURRENT_DATE + make_interval(months => ?))::date
                        WHERE id = ? AND status = 'ABERTO'
                        RETURNING user_id, kind""",
                dto == null ? null : Strings.trimOrNull(dto.note()), RETENTION_MONTHS, id);
        if (updated.isEmpty()) {
            Integer exists = jdbc.queryForObject("SELECT count(*) FROM data_subject_requests WHERE id = ?",
                    Integer.class, id);
            if (exists == null || exists == 0) {
                throw new EntityNotFoundException("Pedido não encontrado.");
            }
            throw new IllegalArgumentException("Este pedido já foi concluído.");
        }
        UUID subjectId = (UUID) updated.get(0).get("user_id");
        if (subjectId == null) {
            subjectId = jdbc.query("""
                            SELECT target_id FROM audit_events
                            WHERE category = 'LGPD' AND action = 'DATA_REQUEST_OPENED' AND details ->> 'requestId' = ?
                            LIMIT 1""",
                    rs -> rs.next() ? rs.getObject(1, UUID.class) : null, id.toString());
        }
        auditService.record(AuditAction.DATA_REQUEST_COMPLETED, subjectId, null, null,
                Map.of("requestId", id.toString(), "kind", updated.get(0).get("kind")));
        return get(id);
    }

    private AuditDTOs.DataRequest get(UUID id) {
        return jdbc.queryForObject(SELECT + " WHERE r.id = ?", (rs, i) -> toDto(rs), id);
    }

    private static AuditDTOs.DataRequest toDto(ResultSet rs) throws SQLException {
        Date completed = rs.getDate("completed_at");
        return new AuditDTOs.DataRequest(
                rs.getObject("id", UUID.class),
                rs.getString("kind"),
                rs.getDate("received_at").toLocalDate(),
                rs.getDate("due_at").toLocalDate(),
                rs.getString("status"),
                completed == null ? null : completed.toLocalDate(),
                AuditQueryService.party(rs.getObject("user_id", UUID.class), rs.getString("subject_name")),
                rs.getString("note"),
                AuditQueryService.party(rs.getObject("created_by", UUID.class), rs.getString("creator_name")));
    }
}
