package com.kinetic.repositories;

import com.kinetic.models.WorkoutPlan;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkoutPlanRepository extends JpaRepository<WorkoutPlan, UUID> {

    @EntityGraph(attributePaths = "exercises")
    List<WorkoutPlan> findByUserId(UUID userId);

    @EntityGraph(attributePaths = "exercises")
    List<WorkoutPlan> findByUserIdOrderByCreatedAtAsc(UUID userId);

    @EntityGraph(attributePaths = "exercises")
    List<WorkoutPlan> findByUserIdAndStatus(UUID userId, String status);

    @EntityGraph(attributePaths = "exercises")
    List<WorkoutPlan> findByUserIdAndStatusOrderByCreatedAtAsc(UUID userId, String status);

    // Arquiva em massa todos os planos ativos do usuario (usado antes de regenerar).
    @Modifying
    @Query("UPDATE WorkoutPlan w SET w.status = 'archived' WHERE w.user.id = :userId AND w.status = 'active'")
    void archiveActivePlans(@Param("userId") UUID userId);

    // Aluno tem ficha vigente montada por personal? Bloqueia a regeneração por IA no app.
    boolean existsByUserIdAndStatusAndCreatedByIsNotNull(UUID userId, String status);

    // Retorna a data de criação do plano ativo mais antigo — define o início do ciclo atual.
    @Query("SELECT MIN(w.createdAt) FROM WorkoutPlan w WHERE w.user.id = :userId AND w.status = 'active'")
    Optional<LocalDateTime> findEarliestActiveCreatedAt(@Param("userId") UUID userId);

    // Última ficha que a IA montou para o próprio aluno (sem personal: createdBy nulo),
    // arquivadas inclusive — base da cota de IA do aluno.
    @Query("SELECT MAX(w.createdAt) FROM WorkoutPlan w WHERE w.user.id = :userId AND w.createdBy IS NULL")
    Optional<LocalDateTime> findLatestAiCreatedAt(@Param("userId") UUID userId);

    // Ficha vigente mais nova de cada aluno — caixa "Hoje" sugere renovar fichas antigas.
    @Query("SELECT w.user.id, MAX(w.createdAt) FROM WorkoutPlan w WHERE w.user.id IN :userIds AND w.status = 'active' GROUP BY w.user.id")
    List<Object[]> findNewestActiveCreatedAtPerUser(@Param("userIds") Collection<UUID> userIds);
}
