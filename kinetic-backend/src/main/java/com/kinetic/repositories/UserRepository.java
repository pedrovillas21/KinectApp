package com.kinetic.repositories;

import com.kinetic.enums.Role;
import com.kinetic.enums.UserStatus;
import com.kinetic.models.User;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
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

    /** Par (userId, frequency) de todos os usuários com frequência definida — usado pelo CommunityStatsService. */
    @Query("SELECT u.id, u.frequency FROM User u WHERE u.frequency IS NOT NULL AND u.frequency > 0")
    List<Object[]> findAllUserIdAndFrequency();

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
