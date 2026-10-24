package com.kinetic.repositories;

import com.kinetic.enums.Role;
import com.kinetic.enums.UserStatus;
import com.kinetic.exceptions.PhoneAlreadyInUseException;
import com.kinetic.models.User;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    /** Busca por e-mail ou lança {@link EntityNotFoundException} (HTTP 404). Centraliza o padrão repetido nos services. */
    default User getByEmailOrThrow(String email) {
        return findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado."));
    }

    boolean existsByEmail(String email);
    boolean existsByCpf(String cpf);

    boolean existsByPhone(String phone);
    boolean existsByPhoneAndIdNot(String phone, UUID id);

    String PHONE_IN_USE_MESSAGE = "Este celular já está cadastrado em outra conta.";

    /**
     * Celular é único entre todas as contas. {@code userId} é a própria conta
     * (null no cadastro), para que regravar o mesmo número não conte como conflito.
     */
    default void ensurePhoneAvailable(String phone, UUID userId) {
        boolean taken = userId == null ? existsByPhone(phone) : existsByPhoneAndIdNot(phone, userId);
        if (taken) {
            throw new PhoneAlreadyInUseException(PHONE_IN_USE_MESSAGE);
        }
    }

    /**
     * Grava já fazendo flush, traduzindo a violação do índice único de celular
     * (corrida entre dois cadastros com o mesmo número) em 409.
     */
    default User saveCheckingPhone(User user) {
        try {
            return saveAndFlush(Objects.requireNonNull(user));
        } catch (DataIntegrityViolationException e) {
            String detail = e.getMostSpecificCause().getMessage();
            if (detail != null && detail.contains("uq_users_phone")) {
                throw new PhoneAlreadyInUseException(PHONE_IN_USE_MESSAGE);
            }
            throw e;
        }
    }

    /** Par (userId, frequency) dos usuários informados com frequência definida — média dos amigos (StatsService). */
    @Query("SELECT u.id, u.frequency FROM User u WHERE u.id IN :ids AND u.frequency IS NOT NULL AND u.frequency > 0")
    List<Object[]> findIdAndFrequencyByIdIn(@Param("ids") Collection<UUID> ids);

    // ── Painel ROOT: métricas e listagens de compliance ────────────────────

    long countByRole(Role role);

    long countByCreatedAtAfter(LocalDateTime after);

    /** Contas criadas a partir de um instante — base da série de crescimento. */
    List<User> findByCreatedAtGreaterThanEqualOrderByCreatedAtAsc(LocalDateTime start);

    List<User> findAllByOrderByCreatedAtDesc();

    List<User> findByRoleOrderByCreatedAtDesc(Role role);

    List<User> findByStatusOrderByCreatedAtDesc(UserStatus status);

    List<User> findByRoleAndStatusOrderByCreatedAtDesc(Role role, UserStatus status);

    // ── Painel EMPRESA: escopo por company_id ──────────────────────────────

    List<User> findByCompanyIdAndRole(UUID companyId, Role role);

    long countByCompanyIdAndRole(UUID companyId, Role role);

    List<User> findByNomeContainingIgnoreCaseAndIdNot(String nome, UUID id);

    /**
     * Busca limitada e ordenada por nome — usada na tela de "Encontrar pessoas".
     * Com {@code nome} vazio, retorna os primeiros usuários do banco (lista padrão),
     * para o usuário não ficar no escuro antes de digitar.
     */
    List<User> findTop30ByNomeContainingIgnoreCaseAndIdNotOrderByNomeAsc(String nome, UUID id);
}
