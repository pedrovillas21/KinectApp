package com.kinetic.services;

import com.kinetic.billing.PaymentGateway;
import com.kinetic.enums.Role;
import com.kinetic.enums.SubscriptionStatus;
import com.kinetic.models.User;
import com.kinetic.repositories.TrainerSubscriptionRepository;
import com.kinetic.repositories.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;
import java.util.Objects;
import java.util.UUID;

/**
 * Exclusão imediata da própria conta (LGPD), confirmada com a senha.
 *
 * <p>As tabelas de treino são anteriores ao Flyway (baseline V6) e as FKs delas
 * para {@code users} e entre si são NO ACTION, então são apagadas aqui, na ordem
 * filho → pai. Todas as tabelas criadas por migrations (social, vínculos com o
 * personal, cobrança, avaliações, códigos, tokens, perfil profissional...) já
 * referenciam {@code users} com ON DELETE CASCADE, e os registros que pertencem
 * a outra pessoa (fichas que o personal montou para o aluno, gerações de IA,
 * avaliações feitas pelo personal, convite resgatado) com ON DELETE SET NULL —
 * conferido em {@code pg_constraint} antes de escrever este serviço. Uma FK nova
 * sem regra faz o DELETE de {@code users} falhar e a transação inteira voltar,
 * nunca deixa a conta pela metade.
 *
 * <p>SQL nativo de propósito: as entidades não mapeiam as coleções do usuário e
 * um delete em massa por JPQL não navega relacionamentos.
 */
@Service
public class AccountDeletionService {

    private static final Logger log = LoggerFactory.getLogger(AccountDeletionService.class);

    @PersistenceContext
    private EntityManager entityManager;

    private final UserRepository userRepository;
    private final TrainerSubscriptionRepository subscriptionRepository;
    private final PasswordEncoder passwordEncoder;
    private final StorageService storageService;
    private final PaymentGateway paymentGateway;

    public AccountDeletionService(UserRepository userRepository,
                                  TrainerSubscriptionRepository subscriptionRepository,
                                  PasswordEncoder passwordEncoder,
                                  StorageService storageService,
                                  PaymentGateway paymentGateway) {
        this.userRepository = userRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.passwordEncoder = passwordEncoder;
        this.storageService = storageService;
        this.paymentGateway = paymentGateway;
    }

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
        if (user.getRole() == Role.ROOT) {
            throw new IllegalArgumentException("A conta ROOT não pode ser excluída pelo app.");
        }
        UUID userId = user.getId();

        // Lido antes do DELETE: depois do commit as linhas já não existem.
        List<String> mediaKeys = mediaKeysOf(userId);

        // Fichas que o personal montou para alunos continuam com o aluno, sem autor
        // (a FK também faz SET NULL; aqui fica explícito e vale antes do delete do usuário).
        execute("UPDATE workout_plans SET created_by_id = NULL WHERE created_by_id = :id AND user_id <> :id", userId);

        // Vínculos personal/aluno (trainer_clients), cobranças entre os dois e convites
        // saem pelo CASCADE no DELETE final: o outro lado perde o acesso na hora.

        // Tabelas anteriores ao Flyway (FKs NO ACTION), de filho para pai. Séries e
        // execuções também são apagadas pelo lado da ficha, caso alguma linha de outro
        // usuário aponte para uma ficha desta conta.
        String ownPlans = "SELECT id FROM workout_plans WHERE user_id = :id";
        String ownExercises = "SELECT id FROM exercises WHERE workout_plan_id IN (" + ownPlans + ")";
        execute("DELETE FROM exercise_set_logs WHERE session_id IN (SELECT id FROM workout_sessions WHERE user_id = :id) "
                + "OR exercise_id IN (" + ownExercises + ")", userId);
        execute("DELETE FROM workout_execution_logs WHERE user_id = :id OR workout_plan_id IN (" + ownPlans + ")", userId);
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

        log.info("Conta {} excluída a pedido do próprio usuário ({} arquivo(s) de mídia a remover).",
                userId, mediaKeys.size());

        // Mídia só sai do Storage depois do commit: se a transação voltar, os posts
        // continuam com as imagens.
        if (!mediaKeys.isEmpty()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    mediaKeys.forEach(storageService::deleteByKey);
                }
            });
        }
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
