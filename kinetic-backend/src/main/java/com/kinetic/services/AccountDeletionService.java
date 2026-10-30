package com.kinetic.services;

import lombok.RequiredArgsConstructor;
import com.kinetic.billing.PaymentGateway;
import com.kinetic.enums.AuditAction;
import com.kinetic.enums.Role;
import com.kinetic.enums.UserStatus;
import com.kinetic.enums.SubscriptionStatus;
import com.kinetic.models.TrainerSubscription;
import com.kinetic.models.User;
import com.kinetic.repositories.TrainerSubscriptionRepository;
import com.kinetic.repositories.UserRepository;
import com.kinetic.security.Pseudonymizer;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

/**
 * Exclusão imediata da conta (LGPD art. 18, VI): pelo próprio titular, confirmada com a
 * senha, ou pelo ROOT a pedido do titular (ex.: conta bloqueada que não entra mais).
 *
 * <p>As tabelas de treino são anteriores ao Flyway (baseline V6) e as FKs delas
 * para {@code users} e entre si são NO ACTION, então são apagadas aqui, na ordem
 * filho → pai. Todas as tabelas criadas por migrations (social, vínculos com o
 * personal, cobrança, avaliações, códigos, tokens, perfil profissional...) já
 * referenciam {@code users} com ON DELETE CASCADE, e os registros que pertencem
 * a outra pessoa (fichas que o personal montou para o aluno, gerações de IA,
 * avaliações feitas pelo personal, convite resgatado, cobranças pagas) com
 * ON DELETE SET NULL. Uma FK nova sem regra faz o DELETE de {@code users} falhar
 * e a transação inteira voltar, nunca deixa a conta pela metade.
 *
 * <p>Fica só o que a lei manda guardar (LGPD art. 16), cada coisa com prazo para
 * sumir ({@link LegalRetentionService#purgeExpired()}): cobranças pagas no financeiro do
 * personal, a prova das fichas aprovadas por IA, o registro da conta excluída e os
 * registros de acesso. Detalhes em RETENCAO-DE-DADOS.md.
 *
 * <p>SQL nativo de propósito: as entidades não mapeiam as coleções do usuário e
 * um delete em massa por JPQL não navega relacionamentos.
 */
@Service
@RequiredArgsConstructor
public class AccountDeletionService {

    public static final String BY_TITULAR = "TITULAR";
    public static final String BY_ADMIN = "ADMIN";

    private static final Logger log = LoggerFactory.getLogger(AccountDeletionService.class);

    @PersistenceContext
    private EntityManager entityManager;

    private final UserRepository userRepository;
    private final TrainerSubscriptionRepository subscriptionRepository;
    private final PasswordEncoder passwordEncoder;
    private final StorageService storageService;
    private final PaymentGateway paymentGateway;
    private final LegalRetentionService retentionService;
    private final Pseudonymizer pseudonymizer;
    private final AuditService auditService;

    /**
     * Apaga a conta de {@code userEmail} e tudo o que é dela. Senha errada ou conta
     * ROOT → {@link IllegalArgumentException} (400), sem tocar em nada.
     */
    @Transactional
    public void deleteAccount(String userEmail, String password) {
        User user = userRepository.getByEmailOrThrow(userEmail);
        if (password == null || !passwordEncoder.matches(password, user.getSenha())) {
            throw new IllegalArgumentException("Senha incorreta.");
        }
        delete(user, BY_TITULAR);
    }

    /**
     * Pelo ROOT, a pedido do titular por e-mail. Conta bloqueada fica marcada para não voltar.
     * A trilha não tem FK para users: o evento sobrevive ao DELETE da própria conta.
     */
    @Transactional
    public void deleteAccountByAdmin(@NonNull UUID userId, String reason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado."));
        auditService.record(AuditAction.USER_DELETED_BY_ADMIN, user.getId(), user.getCompanyId(), reason,
                Map.of("role", user.getRole().name(), "blocked", user.getStatus() == UserStatus.BLOQUEADO));
        delete(user, BY_ADMIN);
    }

    private void delete(User user, String deletedBy) {
        if (user.getRole() == Role.ROOT) {
            throw new IllegalArgumentException("A conta ROOT não pode ser excluída pelo app.");
        }
        UUID userId = user.getId();
        String avatarUrl = user.getAvatarUrl();

        // Lido antes do DELETE: depois do commit as linhas já não existem.
        List<String> mediaKeys = mediaKeysOf(userId);
        String gatewayCustomerId = subscriptionRepository.findByTrainerId(userId)
                .map(TrainerSubscription::getGatewayCustomerId)
                .orElse(null);
        retentionService.recordDeletedAccount(user, gatewayCustomerId, deletedBy);

        // Fichas que o personal montou para alunos continuam com o aluno, sem autor
        // (a FK também faz SET NULL; aqui fica explícito e vale antes do delete do usuário).
        execute("UPDATE workout_plans SET created_by_id = NULL WHERE created_by_id = :id AND user_id <> :id", userId);

        // Vínculos personal/aluno (trainer_clients), mensalidades e convites saem pelo
        // CASCADE no DELETE final: o outro lado perde o acesso na hora.
        retainPaidCharges(user);
        retainApprovedAiGenerations(user);

        // Tabelas anteriores ao Flyway (FKs NO ACTION), de filho para pai. Séries também
        // são apagadas pelo lado da ficha, caso alguma linha de outro usuário aponte para
        // uma ficha desta conta.
        String ownPlans = "SELECT id FROM workout_plans WHERE user_id = :id";
        String ownExercises = "SELECT id FROM exercises WHERE workout_plan_id IN (" + ownPlans + ")";
        execute("DELETE FROM exercise_set_logs WHERE session_id IN (SELECT id FROM workout_sessions WHERE user_id = :id) "
                + "OR exercise_id IN (" + ownExercises + ")", userId);
        execute("DELETE FROM workout_sessions WHERE user_id = :id", userId);
        execute("DELETE FROM exercises WHERE workout_plan_id IN (" + ownPlans + ")", userId);
        execute("DELETE FROM workout_plans WHERE user_id = :id", userId);
        execute("DELETE FROM weight_history WHERE user_id = :id", userId);

        // Assinatura do personal: cancelada no provedor antes do DELETE final. Se o
        // provedor falhar, a exclusão inteira volta (502) e nada fica cobrando uma
        // conta que não existe mais.
        cancelTrainerSubscription(userId);

        // O restante cai pelas FKs (CASCADE / SET NULL).
        execute("DELETE FROM users WHERE id = :id", userId);
        entityManager.clear();

        log.info("Conta {} excluída ({}; {} arquivo(s) de mídia a remover).", userId, deletedBy, mediaKeys.size());

        // Mídia só sai do Storage depois do commit: se a transação voltar, os posts
        // continuam com as imagens.
        if (!mediaKeys.isEmpty() || avatarUrl != null) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    mediaKeys.forEach(storageService::deleteByKey);
                    storageService.deleteAvatar(avatarUrl);
                }
            });
        }
    }

    /**
     * Aluno excluído: as cobranças PAGAS ficam no financeiro do personal (registro de renda
     * para o imposto dele), só com o nome do aluno, até 31/12 do 6º ano após o pagamento
     * (5 anos contados do exercício seguinte ao da declaração). As em aberto e as
     * dispensadas não têm obrigação por trás e saem junto com a conta.
     */
    private void retainPaidCharges(User user) {
        execute("DELETE FROM student_charges WHERE student_id = :id AND status <> 'PAGO'", user.getId());
        entityManager.createNativeQuery("""
                        UPDATE student_charges SET student_name = :name,
                            retain_until = make_date(EXTRACT(YEAR FROM COALESCE(paid_at, due_date))::int + 6, 12, 31)
                        WHERE student_id = :id""")
                .setParameter("name", user.getNome())
                .setParameter("id", user.getId())
                .executeUpdate();
    }

    /**
     * Fichas aprovadas por IA: a declaração do personal, o pedido (com as restrições
     * informadas) e o que foi aprovado ficam 5 anos após a aprovação, como prova de quem
     * prescreveu o treino. O lado excluído vira snapshot (personal: nome e CREF) ou
     * pseudônimo (aluno: HMAC do e-mail, e o nome sai da declaração). Prévias nunca aprovadas não prescreveram nada:
     * perdem o texto e ficam só id, modelo, status e datas.
     */
    private void retainApprovedAiGenerations(User user) {
        UUID userId = user.getId();
        // prompt tem de ter 1+ caractere (chk_ai_gen_payload_limits).
        execute("UPDATE ai_plan_generations SET prompt = '[removido]', ai_output = '', options = NULL, "
                + "approved_plans = NULL, declaration_text = NULL "
                + "WHERE status <> 'APPROVED' AND (trainer_id = :id OR student_id = :id)", userId);

        String retainUntil = "COALESCE(retain_until, (approved_at + INTERVAL '5 years')::date)";
        // A declaração cita o nome do aluno: vira "[aluno excluído]"; o pseudônimo liga ao titular se preciso.
        entityManager.createNativeQuery("UPDATE ai_plan_generations SET student_ref_hash = :hash, "
                        + "declaration_text = replace(declaration_text, :name, '[aluno excluído]'), retain_until = "
                        + retainUntil + " WHERE status = 'APPROVED' AND student_id = :id")
                .setParameter("hash", pseudonymizer.email(user.getEmail()))
                .setParameter("name", user.getNome())
                .setParameter("id", userId)
                .executeUpdate();
        entityManager.createNativeQuery("UPDATE ai_plan_generations SET trainer_name = :name, "
                        + "trainer_cref = (SELECT cref FROM trainer_profiles WHERE user_id = :id), retain_until = "
                        + retainUntil + " WHERE status = 'APPROVED' AND trainer_id = :id")
                .setParameter("name", user.getNome())
                .setParameter("id", userId)
                .executeUpdate();
    }

    /** Keys de imagens de posts e stories do usuário, já normalizadas (inclui URLs legadas). */
    private List<String> mediaKeysOf(UUID userId) {
        @SuppressWarnings("unchecked")
        List<String> raw = entityManager.createNativeQuery(
                        "SELECT image_url FROM social_posts WHERE author_id = :id AND image_url IS NOT NULL")
                .setParameter("id", userId)
                .getResultList();
        return raw.stream()
                .map(storageService::normalizeKey)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
    }

    private void cancelTrainerSubscription(UUID userId) {
        subscriptionRepository.findByTrainerId(userId).ifPresent(sub -> {
            if (sub.getGatewaySubscriptionId() != null
                    && sub.getStatus() != SubscriptionStatus.CANCELADA
                    && paymentGateway.name().equals(sub.getGateway())) {
                paymentGateway.cancelSubscription(sub.getGatewaySubscriptionId());
            }
        });
    }

    private void execute(String sql, UUID userId) {
        entityManager.createNativeQuery(sql).setParameter("id", userId).executeUpdate();
    }
}
