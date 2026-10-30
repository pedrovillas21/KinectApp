package com.kinetic.it;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kinetic.enums.Role;
import com.kinetic.models.Company;
import com.kinetic.models.User;
import com.kinetic.security.Pseudonymizer;
import com.kinetic.services.AccountDeletionService;
import com.kinetic.services.LegalRetentionService;
import com.kinetic.services.TermsService;
import com.kinetic.utils.AppTime;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.http.HttpHeaders.AUTHORIZATION;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Trilha de auditoria (V54): quem fez, sobre quem, por quê; e o que a Auditoria do ROOT devolve. */
class AuditIT extends IntegrationTestBase {

    private static final String REASON = "Pedido do titular por e-mail em 30/10";

    @Autowired
    private JdbcTemplate jdbc;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private AccountDeletionService deletionService;
    @Autowired
    private LegalRetentionService retentionService;
    @Autowired
    private Pseudonymizer pseudonymizer;
    @Autowired
    private TermsService termsService;

    @Test
    void rootActionsRecordActorReasonAndPreviousStatus() throws Exception {
        User root = data.user(Role.ROOT);
        User student = data.user(Role.ALUNO);
        Company network = data.company(null);
        User dono = data.user(Role.DONO, network.getId());

        mvc.perform(json(patch("/api/root/users/{id}/status", student.getId()), root,
                        Map.of("status", "SUSPENSO", "reason", REASON)))
                .andExpect(status().isOk());
        mvc.perform(json(post("/api/root/users/{id}/nova-senha", dono.getId()), root, Map.of("reason", REASON)))
                .andExpect(status().isNoContent());
        mvc.perform(json(post("/api/root/users/{id}/reset-2fa", dono.getId()), root, Map.of("reason", REASON)))
                .andExpect(status().isNoContent());
        mvc.perform(json(delete("/api/root/users/{id}", student.getId()), root, Map.of("reason", REASON)))
                .andExpect(status().isNoContent());

        Map<String, Object> statusEvent = event(student.getId(), "USER_STATUS_CHANGED");
        assertEquals(root.getId(), statusEvent.get("actor_id"));
        assertEquals("ROOT", statusEvent.get("actor_role"));
        assertEquals(REASON, statusEvent.get("reason"));
        JsonNode details = objectMapper.readTree(statusEvent.get("details").toString());
        assertEquals("ATIVO", details.get("from").asText());
        assertEquals("SUSPENSO", details.get("to").asText());
        assertEquals("SUSPENSO", objectMapper.readTree(event(student.getId(), "USER_SOFT_DELETED")
                .get("details").toString()).get("from").asText());
        assertEquals(REASON, event(dono.getId(), "PASSWORD_REGENERATED").get("reason"));
        assertEquals(REASON, event(dono.getId(), "SECOND_FACTOR_RESET").get("reason"));
        assertEquals(network.getId(), event(dono.getId(), "SECOND_FACTOR_RESET").get("company_id"));
    }

    @Test
    void destructiveRootActionsWithoutReasonAre400() throws Exception {
        User root = data.user(Role.ROOT);
        User student = data.user(Role.ALUNO);

        mvc.perform(json(patch("/api/root/users/{id}/status", student.getId()), root, Map.of("status", "SUSPENSO")))
                .andExpect(status().isBadRequest());
        mvc.perform(delete("/api/root/users/{id}", student.getId()).header(AUTHORIZATION, data.bearer(root)))
                .andExpect(status().isBadRequest());
        mvc.perform(json(delete("/api/root/users/{id}/permanent", student.getId()), root, Map.of("reason", "curto")))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/root/users/{id}/reset-2fa", student.getId()).header(AUTHORIZATION, data.bearer(root)))
                .andExpect(status().isBadRequest());

        assertEquals(0, count(student.getId(), null));
    }

    @Test
    void ownerResettingUnitSecondFactorIsRecordedWithoutReason() throws Exception {
        Company network = data.company(null);
        Company unit = data.company(network.getId());
        User dono = data.user(Role.DONO, network.getId());
        User unitAccount = data.user(Role.EMPRESA, unit.getId());

        mvc.perform(post("/api/dono/unidades/{id}/reset-2fa", unit.getId()).header(AUTHORIZATION, data.bearer(dono)))
                .andExpect(status().isNoContent());

        Map<String, Object> e = event(unitAccount.getId(), "SECOND_FACTOR_RESET");
        assertEquals(dono.getId(), e.get("actor_id"));
        assertEquals("DONO", e.get("actor_role"));
        assertNull(e.get("reason"));
    }

    @Test
    void companyInvitingTrainerIsRecorded() throws Exception {
        Company unit = data.company(data.company(null).getId());
        User empresa = data.user(Role.EMPRESA, unit.getId());
        User trainer = data.user(Role.PERSONAL);

        mvc.perform(json(post("/api/empresa/personais"), empresa, Map.of("email", trainer.getEmail())))
                .andExpect(status().isCreated());

        Map<String, Object> e = event(trainer.getId(), "TRAINER_INVITED_TO_COMPANY");
        assertEquals(empresa.getId(), e.get("actor_id"));
        assertEquals(unit.getId(), e.get("company_id"));
    }

    @Test
    void failedLoginIsRecordedWithoutPlainEmail() throws Exception {
        User student = data.user(Role.ALUNO);
        String unknown = "ninguem-" + UUID.randomUUID() + "@teste.kinetic.invalid";

        login(student.getEmail(), "Senha-errada-1");
        login(unknown, "Senha-errada-1");

        Map<String, Object> known = event(student.getId(), "LOGIN_FAILED");
        assertEquals("USER", known.get("target_type"));
        assertNull(known.get("actor_id"));

        List<Map<String, Object>> anonymous = jdbc.queryForList("""
                SELECT * FROM audit_events WHERE action = 'LOGIN_FAILED' AND target_id IS NULL
                  AND details ->> 'emailHash' IS NOT NULL ORDER BY id DESC LIMIT 1""");
        assertEquals(1, anonymous.size());
        Integer leaks = jdbc.queryForObject("SELECT count(*) FROM audit_events WHERE details::text ILIKE ?",
                Integer.class, "%" + unknown + "%");
        assertEquals(0, leaks);
    }

    /** 5 tentativas por minuto passam (cada uma registrada); as barradas viram 1 registro por hora. */
    @Test
    void rateLimitedLoginIsRecordedOncePerHour() throws Exception {
        User student = data.user(Role.ALUNO);
        String unknown = "ninguem-" + UUID.randomUUID() + "@teste.kinetic.invalid";

        for (int i = 0; i < 7; i++) {
            login(student.getEmail(), "Senha-errada-1");
            login(unknown, "Senha-errada-1");
        }

        assertEquals(5, count(student.getId(), "LOGIN_FAILED"));
        assertEquals(1, count(student.getId(), "LOGIN_RATE_LIMITED"));
        assertEquals(1, jdbc.queryForObject("""
                SELECT count(*) FROM audit_events WHERE action = 'LOGIN_RATE_LIMITED' AND target_id IS NULL
                  AND details ->> 'emailHash' = ?""", Integer.class, pseudonymizer.email(unknown)));
    }

    @Test
    void healthReadsAreDedupedPerHourAndKind() throws Exception {
        User trainer = data.user(Role.PERSONAL);
        User student = data.user(Role.ALUNO);
        data.link(trainer, student, null);
        data.assessment(trainer, student);

        for (int i = 0; i < 2; i++) {
            mvc.perform(get("/api/trainer/students/{id}/assessments", student.getId())
                    .header(AUTHORIZATION, data.bearer(trainer))).andExpect(status().isOk());
        }
        mvc.perform(get("/api/trainer/students/{id}/protocol", student.getId())
                .header(AUTHORIZATION, data.bearer(trainer))).andExpect(status().isOk());

        assertEquals(1, jdbc.queryForObject("""
                SELECT count(*) FROM audit_events WHERE action = 'HEALTH_DATA_VIEWED' AND target_id = ?
                  AND details ->> 'kind' = 'ASSESSMENTS'""", Integer.class, student.getId()));
        assertEquals(1, jdbc.queryForObject("""
                SELECT count(*) FROM audit_events WHERE action = 'HEALTH_DATA_VIEWED' AND target_id = ?
                  AND details ->> 'kind' = 'PROTOCOL'""", Integer.class, student.getId()));
        assertEquals(trainer.getId(), event(student.getId(), "HEALTH_DATA_VIEWED").get("actor_id"));
    }

    @Test
    void accessLogSearchNeedsReasonAndIsRecorded() throws Exception {
        User root = data.user(Role.ROOT);
        User student = data.user(Role.ALUNO);
        jdbc.update("INSERT INTO access_logs (user_id, ip, event) VALUES (?, '203.0.113.7', 'LOGIN')", student.getId());

        mvc.perform(json(post("/api/root/audit/access-logs/search"), root,
                        Map.of("email", student.getEmail(), "from", "2026-01-01", "to", "2099-12-31")))
                .andExpect(status().isBadRequest());
        String body = mvc.perform(json(post("/api/root/audit/access-logs/search"), root,
                        Map.of("email", student.getEmail(), "from", "2026-01-01", "to", "2099-12-31", "reason", REASON)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertEquals("203.0.113.7", objectMapper.readTree(body).get("logs").get(0).get("ip").asText());
        Map<String, Object> e = event(student.getId(), "ACCESS_LOGS_VIEWED");
        assertEquals(root.getId(), e.get("actor_id"));
        assertEquals(REASON, e.get("reason"));
    }

    @Test
    void accessLogSearchFindsDeletedAccountByPseudonym() throws Exception {
        User root = data.user(Role.ROOT);
        User student = data.user(Role.ALUNO);
        deletionService.deleteAccountByAdmin(student.getId(), REASON);

        String body = mvc.perform(json(post("/api/root/audit/access-logs/search"), root,
                        Map.of("email", student.getEmail(), "from", "2026-01-01", "to", "2099-12-31", "reason", REASON)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode result = objectMapper.readTree(body);
        assertTrue(result.get("deletedAccount").asBoolean());
        assertEquals(student.getId().toString(), result.get("userId").asText());
    }

    @Test
    void eventOfDeletedAccountComesWithoutName() throws Exception {
        User root = data.user(Role.ROOT);
        User student = data.user(Role.ALUNO);

        mvc.perform(json(delete("/api/root/users/{id}/permanent", student.getId()), root, Map.of("reason", REASON)))
                .andExpect(status().isNoContent());

        String body = mvc.perform(get("/api/root/audit/events")
                        .param("targetId", student.getId().toString())
                        .header(AUTHORIZATION, data.bearer(root)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        JsonNode event = objectMapper.readTree(body).get("content").get(0);
        assertEquals("USER_DELETED_BY_ADMIN", event.get("action").asText());
        assertTrue(event.get("target").get("deleted").asBoolean());
        assertTrue(event.get("target").get("name").isNull());
        assertEquals(root.getNome(), event.get("actor").get("name").asText());
        // IP é dado pessoal: só na categoria SECURITY.
        assertTrue(event.get("ip").isNull());
    }

    @Test
    void lgpdSummaryCountsDeletionsRequestsAndTerms() throws Exception {
        User root = data.user(Role.ROOT);
        User blocked = data.user(Role.ALUNO);
        User titular = data.user(Role.ALUNO);
        mvc.perform(json(patch("/api/root/users/{id}/status", blocked.getId()), root,
                        Map.of("status", "BLOQUEADO", "reason", REASON)))
                .andExpect(status().isOk());
        mvc.perform(json(delete("/api/root/users/{id}/permanent", blocked.getId()), root, Map.of("reason", REASON)))
                .andExpect(status().isNoContent());
        mvc.perform(json(post("/api/root/audit/requests"), root, Map.of("kind", "ACESSO", "email", titular.getEmail())))
                .andExpect(status().isCreated());

        String today = AppTime.today().toString();
        String body = mvc.perform(get("/api/root/audit/lgpd").param("from", today).param("to", today).param("size", "50")
                        .header(AUTHORIZATION, data.bearer(root)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode lgpd = objectMapper.readTree(body);
        assertTrue(lgpd.get("deletions").get("byAdmin").asLong() >= 1);
        assertTrue(lgpd.get("deletions").get("blocked").asLong() >= 1);
        assertTrue(lgpd.get("requests").get("open").asLong() >= 1);
        assertEquals(termsService.currentVersion(), lgpd.get("terms").get("currentVersion").asText());
        JsonNode deleted = null;
        for (JsonNode a : lgpd.get("deletedAccounts").get("content")) {
            if (a.get("userId").asText().equals(blocked.getId().toString())) deleted = a;
        }
        assertEquals("ADMIN", deleted.get("deletedBy").asText());
        assertTrue(deleted.get("blocked").asBoolean());
        // Quem excluiu sai do evento da trilha; nenhuma coluna pessoal da conta excluída.
        assertEquals(root.getNome(), deleted.get("deletedByAdmin").get("name").asText());
        assertFalse(body.contains(blocked.getEmail()));
        assertFalse(body.contains(blocked.getNome()));
    }

    @Test
    void aiAuditNeverReturnsPromptOrOutput() throws Exception {
        User root = data.user(Role.ROOT);
        User trainer = data.user(Role.PERSONAL);
        User student = data.user(Role.ALUNO);
        jdbc.update("""
                INSERT INTO ai_plan_generations
                    (trainer_id, student_id, prompt, ai_output, status, approved_at, approved_plans, declaration_text)
                VALUES (?, ?, 'condição: hipertensão grave', '{"saida":"hipertensão"}', 'APPROVED', now(), '[]', 'ok')""",
                trainer.getId(), student.getId());

        String body = mvc.perform(get("/api/root/audit/ai").header(AUTHORIZATION, data.bearer(root)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertFalse(body.contains("hipertensão"));
        assertFalse(body.contains("prompt"));
        assertFalse(body.contains("aiOutput"));
        assertTrue(objectMapper.readTree(body).get("approved").asLong() >= 1);
    }

    @Test
    void purgeDeletesExpiredEventsAndRecordsIt() {
        Long expired = jdbc.queryForObject("""
                INSERT INTO audit_events (category, action, retain_until) VALUES ('ADMIN', 'UNIT_UPDATED', CURRENT_DATE - 1)
                RETURNING id""", Long.class);

        retentionService.purgeExpired();

        assertEquals(0, jdbc.queryForObject("SELECT count(*) FROM audit_events WHERE id = ?", Integer.class, expired));
        Map<String, Object> purge = jdbc.queryForMap("""
                SELECT details FROM audit_events WHERE action = 'RETENTION_PURGED' ORDER BY id DESC LIMIT 1""");
        assertTrue(purge.get("details").toString().contains("audit_events"));
    }

    @Test
    void dataSubjectRequestLifecycleSurvivesAccountDeletion() throws Exception {
        User root = data.user(Role.ROOT);
        User student = data.user(Role.ALUNO);

        String created = mvc.perform(json(post("/api/root/audit/requests"), root,
                        Map.of("kind", "ELIMINACAO", "email", student.getEmail(), "receivedAt", "2026-10-20")))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        JsonNode request = objectMapper.readTree(created);
        assertEquals("ABERTO", request.get("status").asText());
        assertEquals("2026-11-04", request.get("dueAt").asText());
        String id = request.get("id").asText();

        mvc.perform(json(patch("/api/root/audit/requests/{id}", id), root, Map.of("note", "Conta excluída")))
                .andExpect(status().isOk());
        mvc.perform(json(patch("/api/root/audit/requests/{id}", id), root, Map.of()))
                .andExpect(status().isBadRequest());
        mvc.perform(json(delete("/api/root/users/{id}/permanent", student.getId()), root, Map.of("reason", REASON)))
                .andExpect(status().isNoContent());

        String list = mvc.perform(get("/api/root/audit/requests").param("size", "50")
                        .header(AUTHORIZATION, data.bearer(root)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        JsonNode mine = null;
        for (JsonNode r : objectMapper.readTree(list).get("content")) {
            if (r.get("id").asText().equals(id)) mine = r;
        }
        assertEquals("CONCLUIDO", mine.get("status").asText());
        assertTrue(mine.get("subject").isNull());
        assertEquals(1, count(student.getId(), "DATA_REQUEST_OPENED"));
        assertEquals(1, count(student.getId(), "DATA_REQUEST_COMPLETED"));
    }

    @Test
    void auditAreaIsRootOnly() throws Exception {
        Company network = data.company(null);
        Company unit = data.company(network.getId());
        for (User user : List.of(data.user(Role.ALUNO), data.user(Role.PERSONAL), data.user(Role.EMPRESA, unit.getId()),
                data.user(Role.DONO, network.getId()))) {
            for (String path : List.of("/api/root/audit/events", "/api/root/audit/lgpd", "/api/root/audit/ai",
                    "/api/root/audit/requests", "/api/root/audit/billing-gateway")) {
                mvc.perform(get(path).header(AUTHORIZATION, data.bearer(user))).andExpect(status().isForbidden());
            }
        }
    }

    // ── Apoio ───────────────────────────────────────────────────────────────

    private MockHttpServletRequestBuilder json(MockHttpServletRequestBuilder request, User as, Object body)
            throws Exception {
        return request.header(AUTHORIZATION, data.bearer(as))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body));
    }

    private void login(String email, String password) throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("email", email, "senha", password))));
    }

    /** Evento mais recente da ação sobre o alvo. */
    private Map<String, Object> event(UUID targetId, String action) {
        return jdbc.queryForMap("SELECT * FROM audit_events WHERE target_id = ? AND action = ? ORDER BY id DESC LIMIT 1",
                targetId, action);
    }

    private int count(UUID targetId, String action) {
        Integer n = action == null
                ? jdbc.queryForObject("SELECT count(*) FROM audit_events WHERE target_id = ?", Integer.class, targetId)
                : jdbc.queryForObject("SELECT count(*) FROM audit_events WHERE target_id = ? AND action = ?",
                        Integer.class, targetId, action);
        return n == null ? 0 : n;
    }
}
