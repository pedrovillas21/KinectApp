package com.kinetic.enums;

import static com.kinetic.enums.AuditCategory.ADMIN;
import static com.kinetic.enums.AuditCategory.BILLING;
import static com.kinetic.enums.AuditCategory.HEALTH;
import static com.kinetic.enums.AuditCategory.LGPD;
import static com.kinetic.enums.AuditCategory.SECURITY;

/**
 * Cada ação auditada já diz a categoria, o tipo do alvo e como gravar, para quem chama o
 * AuditService não repetir regra. Os rótulos em pt-BR ficam no painel (auditLabels.ts).
 */
public enum AuditAction {

    // ── ADMIN ───────────────────────────────────────────────────────────────
    COMPANY_CREATED(ADMIN, Target.COMPANY),
    PERSONAL_CREATED(ADMIN, Target.USER),
    USER_STATUS_CHANGED(ADMIN, Target.USER),
    USER_SOFT_DELETED(ADMIN, Target.USER),
    USER_DELETED_BY_ADMIN(ADMIN, Target.USER),
    PASSWORD_REGENERATED(ADMIN, Target.USER),
    SECOND_FACTOR_RESET(ADMIN, Target.USER),
    UNIT_CREATED(ADMIN, Target.COMPANY),
    UNIT_UPDATED(ADMIN, Target.COMPANY),
    UNIT_STATUS_CHANGED(ADMIN, Target.COMPANY),
    TRAINER_INVITED_TO_COMPANY(ADMIN, Target.USER),
    TRAINER_REMOVED_FROM_COMPANY(ADMIN, Target.USER),
    COMPANY_INVITE_ACCEPTED(ADMIN, Target.USER),
    COMPANY_INVITE_DECLINED(ADMIN, Target.USER),
    TRAINER_LEFT_COMPANY(ADMIN, Target.USER),
    STUDENT_LINKED_BY_COMPANY(ADMIN, Target.USER),
    COMPANY_LINK_ENDED(ADMIN, Target.LINK),
    ACCESS_LOGS_VIEWED(ADMIN, Target.USER),

    // ── SECURITY ────────────────────────────────────────────────────────────
    LOGIN_FAILED(SECURITY, Target.USER, false, true),
    // Por hora: com IPs trocando, cada tentativa barrada viraria uma linha guardada 6 meses.
    LOGIN_RATE_LIMITED(SECURITY, Target.USER, true, true),
    TOTP_ENABLED(SECURITY, Target.USER),
    TOTP_FAILED(SECURITY, Target.USER, false, true),
    RECOVERY_CODE_USED(SECURITY, Target.USER),
    PASSWORD_CHANGED(SECURITY, Target.USER),
    PASSWORD_RESET_COMPLETED(SECURITY, Target.USER),
    PASSWORD_RESET_FAILED(SECURITY, Target.USER, false, true),
    EMAIL_CONFIRMED(SECURITY, Target.USER),

    // ── HEALTH (alvo: o aluno dono do dado) ─────────────────────────────────
    HEALTH_DATA_VIEWED(HEALTH, Target.USER, true, false),
    ASSESSMENT_CREATED(HEALTH, Target.USER),
    ASSESSMENT_UPDATED(HEALTH, Target.USER),
    ASSESSMENT_DELETED(HEALTH, Target.USER),
    PROTOCOL_UPDATED(HEALTH, Target.USER),

    // ── BILLING (alvo: o personal da assinatura) ────────────────────────────
    SUBSCRIPTION_STATUS_CHANGED(BILLING, Target.USER),
    AI_PACK_CREDITED(BILLING, Target.USER),

    // ── LGPD ────────────────────────────────────────────────────────────────
    RETENTION_PURGED(LGPD, Target.NONE),
    DATA_REQUEST_OPENED(LGPD, Target.USER),
    DATA_REQUEST_COMPLETED(LGPD, Target.USER);

    /** Tipo do que target_id aponta. */
    public enum Target {
        USER, COMPANY, LINK, NONE
    }

    private final AuditCategory category;
    private final Target target;
    /**
     * Grava no máximo 1 por hora por autor + alvo + details.kind + details.emailHash
     * (leitura de dado de saúde, login barrado por excesso de tentativas).
     */
    private final boolean hourly;
    /** Falha de segurança: o registro fica mesmo quando a requisição volta atrás. */
    private final boolean survivesRollback;

    AuditAction(AuditCategory category, Target target) {
        this(category, target, false, false);
    }

    AuditAction(AuditCategory category, Target target, boolean hourly, boolean survivesRollback) {
        this.category = category;
        this.target = target;
        this.hourly = hourly;
        this.survivesRollback = survivesRollback;
    }

    public AuditCategory category() {
        return category;
    }

    public Target target() {
        return target;
    }

    public boolean hourly() {
        return hourly;
    }

    public boolean survivesRollback() {
        return survivesRollback;
    }
}
