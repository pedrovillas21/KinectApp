package com.kinetic.dtos;

import com.kinetic.enums.AuditCategory;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.data.domain.Page;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Auditoria do painel ROOT (/api/root/audit). Nenhum DTO traz e-mail, CPF ou dado de
 * saúde: os nomes saem de um JOIN na leitura e conta excluída vem só com o id.
 */
public final class AuditDTOs {

    private AuditDTOs() {}

    /** Conta ou empresa citada num registro. Excluída: {@code deleted} e nome nulo. */
    public record Party(UUID id, String name, boolean deleted) {}

    /** O IP só vem na categoria SECURITY. */
    public record Event(
            long id,
            Instant occurredAt,
            AuditCategory category,
            String action,
            Party actor,
            String actorRole,
            String targetType,
            Party target,
            Party company,
            String ip,
            String reason,
            Map<String, Object> details
    ) {}

    // ── Registros de acesso (Marco Civil art. 15) ───────────────────────────

    /** E-mail no corpo, nunca na URL; o motivo vai para a trilha. */
    public record AccessLogSearch(
            @NotBlank(message = "Informe o e-mail da conta.")
            @Email(message = "E-mail inválido.")
            String email,
            @NotNull(message = "Informe o início do período.")
            LocalDate from,
            @NotNull(message = "Informe o fim do período.")
            LocalDate to,
            @NotBlank(message = ValidationRules.REASON_REQUIRED)
            @Size(min = ValidationRules.REASON_MIN, max = ValidationRules.REASON_MAX, message = ValidationRules.REASON_SIZE)
            String reason
    ) {}

    public record AccessLog(Instant accessedAt, String ip, String event) {}

    /** {@code truncated}: o período tinha mais linhas que o limite da resposta. */
    public record AccessLogResult(UUID userId, boolean deletedAccount, List<AccessLog> logs, boolean truncated) {}

    // ── LGPD ────────────────────────────────────────────────────────────────

    /** Conta excluída, sem nenhuma coluna pessoal. {@code deletedByAdmin}: o ROOT que excluiu, se foi ele. */
    public record DeletedAccount(
            UUID userId,
            String role,
            String deletedBy,
            Party deletedByAdmin,
            boolean blocked,
            Instant deletedAt,
            LocalDate retainUntil
    ) {}

    public record Deletions(long byTitular, long byAdmin, long blocked) {}

    public record Terms(String currentVersion, long accepted, long pending) {}

    public record LastPurge(Instant at, Map<String, Object> counts) {}

    public record RequestCounts(long open, long dueSoon, long overdue) {}

    public record Lgpd(
            Deletions deletions,
            Terms terms,
            LastPurge lastPurge,
            RequestCounts requests,
            Page<DeletedAccount> deletedAccounts
    ) {}

    // ── Pedidos de titulares (LGPD art. 18 e 19) ────────────────────────────

    /** {@code subject} nulo: a conta do titular foi excluída depois do pedido. */
    public record DataRequest(
            UUID id,
            String kind,
            LocalDate receivedAt,
            LocalDate dueAt,
            String status,
            LocalDate completedAt,
            Party subject,
            String note,
            Party createdBy
    ) {}

    public record DataRequestCreate(
            @NotNull(message = "Informe o tipo do pedido.")
            DataRequestKind kind,
            @NotBlank(message = "Informe o e-mail da conta do titular.")
            @Email(message = "E-mail inválido.")
            String email,
            /* Nulo = hoje. */
            LocalDate receivedAt,
            @Size(max = 500, message = "Observação longa demais (até 500 caracteres).")
            String note
    ) {}

    /** Só conclui: pedido concluído não reabre (abre-se outro). */
    public record DataRequestComplete(
            @Size(max = 500, message = "Observação longa demais (até 500 caracteres).")
            String note
    ) {}

    public enum DataRequestKind { ACESSO, CORRECAO, ELIMINACAO, REVOGACAO, INFORMACAO }

    public enum DataRequestStatus { ABERTO, CONCLUIDO }

    // ── Fichas por IA ───────────────────────────────────────────────────────

    /** Nunca traz prompt, options nem ai_output: contêm condições médicas. */
    public record AiApproval(
            UUID id,
            Instant approvedAt,
            Party trainer,
            String trainerCref,
            String model,
            Boolean replacedCurrent,
            Party student
    ) {}

    public record Ai(long previews, long approved, Page<AiApproval> approvals) {}

    // ── Cobrança ────────────────────────────────────────────────────────────

    public record BillingGateway(String gateway, boolean demo) {}
}
