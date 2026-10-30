package com.kinetic.enums;

/**
 * Grupo de um evento de auditoria e por quanto tempo ele fica (RETENCAO-DE-DADOS.md).
 * Segurança segue os registros de acesso (Marco Civil art. 15: 6 meses); as demais
 * seguem o prazo de defesa (CDC art. 27: 5 anos).
 */
public enum AuditCategory {
    ADMIN(60),
    SECURITY(6),
    HEALTH(60),
    BILLING(60),
    LGPD(60);

    private final int retentionMonths;

    AuditCategory(int retentionMonths) {
        this.retentionMonths = retentionMonths;
    }

    public int retentionMonths() {
        return retentionMonths;
    }
}
