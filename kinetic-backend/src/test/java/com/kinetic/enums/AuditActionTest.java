package com.kinetic.enums;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Prazos da trilha (RETENCAO-DE-DADOS.md) e regras de gravação de cada ação. */
class AuditActionTest {

    @Test
    void everyActionHasCategoryAndTheRightRetention() {
        for (AuditAction action : AuditAction.values()) {
            assertNotNull(action.category(), action.name());
            assertNotNull(action.target(), action.name());
            assertTrue(action.name().length() <= 40, action + " não cabe em audit_events.action");
            int expected = action.category() == AuditCategory.SECURITY ? 6 : 60;
            assertEquals(expected, action.category().retentionMonths(), action.name());
        }
    }

    /** Só leitura de saúde e login barrado deduplicam por hora; só falha de segurança sobrevive ao rollback. */
    @Test
    void writeRulesStayWhereTheyBelong() {
        for (AuditAction action : AuditAction.values()) {
            assertEquals(action == AuditAction.HEALTH_DATA_VIEWED || action == AuditAction.LOGIN_RATE_LIMITED,
                    action.hourly(), action.name());
            if (action.survivesRollback()) {
                assertEquals(AuditCategory.SECURITY, action.category(), action.name());
                assertTrue(action.name().endsWith("_FAILED") || action.name().endsWith("_RATE_LIMITED"), action.name());
            }
        }
    }
}
