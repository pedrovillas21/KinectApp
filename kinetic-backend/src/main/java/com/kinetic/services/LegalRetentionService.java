package com.kinetic.services;

import com.kinetic.enums.UserStatus;
import com.kinetic.models.User;
import com.kinetic.security.Pseudonymizer;
import com.kinetic.utils.AppTime;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.sql.Date;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.util.UUID;

/**
 * O que sobra de uma conta excluída, e por quanto tempo (tabelas da V49). Cada prazo e
 * a base legal estão em RETENCAO-DE-DADOS.md; nada disto é exposto por rota da API.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LegalRetentionService {

    /** Marco Civil art. 15: registros de acesso por 6 meses. */
    static final int ACCESS_LOG_MONTHS = 6;
    /** CDC art. 27 / CTN art. 173: prazo de defesa e fiscal. */
    static final int DEFENSE_YEARS = 5;

    private final JdbcTemplate jdbc;
    private final Pseudonymizer pseudonymizer;

    /**
     * Antes do DELETE da conta. Dados cadastrais por 6 meses (para dar sentido aos
     * registros de acesso numa ordem judicial); depois só os pseudônimos, o aceite
     * dos termos, o cliente no gateway e o bloqueio, por 5 anos.
     */
    public void recordDeletedAccount(User user, String gatewayCustomerId, String deletedBy) {
        LocalDate today = AppTime.today();
        jdbc.update("""
                INSERT INTO deleted_accounts (user_id, role, email, nome, cpf, phone, email_hash, cpf_hash,
                    terms_version, terms_accepted_at, gateway_customer_id, blocked, deleted_by,
                    identity_until, retain_until)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (user_id) DO NOTHING""",
                user.getId(), user.getRole().name(), user.getEmail(), user.getNome(), user.getCpf(), user.getPhone(),
                pseudonymizer.email(user.getEmail()), pseudonymizer.cpf(user.getCpf()),
                user.getTermsVersion(),
                user.getTermsAcceptedAt() == null ? null : Timestamp.from(user.getTermsAcceptedAt()),
                gatewayCustomerId, user.getStatus() == UserStatus.BLOQUEADO, deletedBy,
                Date.valueOf(today.plusMonths(ACCESS_LOG_MONTHS)), Date.valueOf(today.plusYears(DEFENSE_YEARS)));
    }

    /** E-mail ou CPF de uma conta excluída enquanto estava bloqueada por abuso. */
    public boolean isBlockedIdentity(String email, String cpf) {
        Integer count = jdbc.queryForObject("""
                SELECT count(*) FROM deleted_accounts
                WHERE blocked AND retain_until >= CURRENT_DATE
                  AND (email_hash = ? OR (cpf_hash IS NOT NULL AND cpf_hash = ?))""",
                Integer.class, pseudonymizer.email(email), pseudonymizer.cpf(cpf));
        return count != null && count > 0;
    }

    /** Marco Civil art. 15. Melhor esforço: falha aqui não derruba o login. */
    public void recordAccess(UUID userId, String ip, String event) {
        try {
            jdbc.update("INSERT INTO access_logs (user_id, ip, event) VALUES (?, ?, ?)",
                    userId, ip == null ? "desconhecido" : ip, event);
        } catch (RuntimeException e) {
            log.warn("Registro de acesso não gravado: {}", e.getMessage());
        }
    }

    /** Uso do app com o login já feito: grava se este IP não aparece para o usuário na última hora. */
    public void recordAccessHourly(UUID userId, String ip) {
        try {
            jdbc.update("""
                    INSERT INTO access_logs (user_id, ip, event)
                    SELECT ?, ?, 'ACCESS'
                    WHERE NOT EXISTS (SELECT 1 FROM access_logs
                                      WHERE user_id = ? AND ip = ? AND accessed_at > now() - INTERVAL '1 hour')""",
                    userId, ip == null ? "desconhecido" : ip, userId, ip == null ? "desconhecido" : ip);
        } catch (RuntimeException e) {
            log.warn("Registro de acesso não gravado: {}", e.getMessage());
        }
    }

    /** Expurgo diário: cada registro sai no fim do próprio prazo. */
    @Scheduled(cron = "0 30 3 * * *")
    @SchedulerLock(name = "purgeExpiredLegalRetention")
    public void purgeExpired() {
        int access = jdbc.update("DELETE FROM access_logs WHERE accessed_at < now() - make_interval(months => ?)",
                ACCESS_LOG_MONTHS);
        int identities = jdbc.update("""
                UPDATE deleted_accounts SET email = NULL, nome = NULL, cpf = NULL, phone = NULL
                WHERE identity_until < CURRENT_DATE AND email IS NOT NULL""");
        int accounts = jdbc.update("DELETE FROM deleted_accounts WHERE retain_until < CURRENT_DATE");
        int charges = jdbc.update("DELETE FROM student_charges WHERE retain_until < CURRENT_DATE");
        int generations = jdbc.update("DELETE FROM ai_plan_generations WHERE retain_until < CURRENT_DATE");
        log.info("Retenção legal: {} acesso(s), {} identidade(s), {} conta(s), {} cobrança(s), {} geração(ões) "
                + "de IA expurgados.", access, identities, accounts, charges, generations);
    }
}
