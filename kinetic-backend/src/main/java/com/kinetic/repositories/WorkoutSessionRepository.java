package com.kinetic.repositories;

import com.kinetic.models.WorkoutSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkoutSessionRepository extends JpaRepository<WorkoutSession, UUID> {

    long countByUserIdAndSessionDateGreaterThanEqualAndSessionDateLessThan(
            UUID userId,
            LocalDate startDate,
            LocalDate endDate
    );

    /** Segundos de treino já gravados pelo usuário no dia. */
    @Query("SELECT COALESCE(SUM(ws.durationInSeconds), 0) FROM WorkoutSession ws "
            + "WHERE ws.user.id = :userId AND ws.sessionDate = :date")
    long sumDurationByUserIdAndSessionDate(@Param("userId") UUID userId, @Param("date") LocalDate date);

    boolean existsByUserIdAndClientSessionId(UUID userId, UUID clientSessionId);

    List<WorkoutSession> findByUserIdAndSessionDateBetween(
            UUID userId,
            LocalDate startDate,
            LocalDate endDate
    );

    @Query("SELECT ws.sessionDate FROM WorkoutSession ws WHERE ws.user.id = :userId AND ws.sessionDate BETWEEN :startDate AND :endDate")
    List<LocalDate> findSessionDatesByUserIdBetween(
            @Param("userId") UUID userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    /** Contagem de sessões por usuário no intervalo — média de consistência dos amigos (StatsService). */
    @Query("""
            SELECT ws.user.id, COUNT(ws)
            FROM WorkoutSession ws
            WHERE ws.user.id IN :userIds
              AND ws.sessionDate BETWEEN :startDate AND :endDate
            GROUP BY ws.user.id
            """)
    List<Object[]> countSessionsPerUserBetween(
            @Param("userIds")   Collection<UUID> userIds,
            @Param("startDate") LocalDate startDate,
            @Param("endDate")   LocalDate endDate
    );

    /** Contagem de sessões por dia para um conjunto de usuários — volume da unidade (EMPRESA). */
    @Query("""
            SELECT ws.sessionDate, COUNT(ws)
            FROM WorkoutSession ws
            WHERE ws.user.id IN :userIds
              AND ws.sessionDate BETWEEN :startDate AND :endDate
            GROUP BY ws.sessionDate
            ORDER BY ws.sessionDate
            """)
    List<Object[]> countSessionsPerDayForUsers(
            @Param("userIds")   Collection<UUID> userIds,
            @Param("startDate") LocalDate startDate,
            @Param("endDate")   LocalDate endDate
    );

    /** Último dia com treino de cada usuário (de todos os tempos) — painel de aderência do personal. */
    @Query("""
            SELECT ws.user.id, MAX(ws.sessionDate)
            FROM WorkoutSession ws
            WHERE ws.user.id IN :userIds
            GROUP BY ws.user.id
            """)
    List<Object[]> findLastSessionDatePerUser(@Param("userIds") Collection<UUID> userIds);

    /** Dias distintos com treino de cada usuário desde {@code since} — janelas do alerta de risco. */
    @Query("""
            SELECT DISTINCT ws.user.id, ws.sessionDate
            FROM WorkoutSession ws
            WHERE ws.user.id IN :userIds
              AND ws.sessionDate >= :since
            """)
    List<Object[]> findSessionDaysForUsersSince(
            @Param("userIds") Collection<UUID> userIds,
            @Param("since")   LocalDate since
    );

    /** Soma de segundos treinados por usuário no intervalo — alimenta o Ranking da Arena da Home. */
    @Query("""
            SELECT ws.user.id, COALESCE(SUM(ws.durationInSeconds), 0)
            FROM WorkoutSession ws
            WHERE ws.user.id IN :userIds
              AND ws.sessionDate BETWEEN :startDate AND :endDate
            GROUP BY ws.user.id
            """)
    List<Object[]> sumDurationSecondsPerUserBetween(
            @Param("userIds")   Collection<UUID> userIds,
            @Param("startDate") LocalDate startDate,
            @Param("endDate")   LocalDate endDate
    );

    long countByUserId(UUID userId);

    /** Último treino com ficha: a próxima ficha do rodízio da Home é a seguinte a ela. */
    Optional<WorkoutSession> findFirstByUserIdAndWorkoutPlanIsNotNullOrderByCreatedAtDesc(UUID userId);

    /** Último treino de cada ficha do usuário. Cada linha: [ficha.id (UUID), MAX(createdAt) (Instant)]. */
    @Query("SELECT ws.workoutPlan.id, MAX(ws.createdAt) FROM WorkoutSession ws "
            + "WHERE ws.user.id = :userId AND ws.workoutPlan IS NOT NULL GROUP BY ws.workoutPlan.id")
    List<Object[]> findLatestSessionPerPlan(@Param("userId") UUID userId);

    Optional<WorkoutSession> findByUserIdAndClientSessionId(UUID userId, UUID clientSessionId);

    /** Histórico de treinos do usuário, mais recentes primeiro — aba "Treinos" do perfil. */
    Page<WorkoutSession> findByUserIdOrderBySessionDateDescIdDesc(UUID userId, Pageable pageable);

    /** Todas as datas de treino do usuário (uma por sessão), em ordem — conquistas e sequências. */
    @Query("SELECT ws.sessionDate FROM WorkoutSession ws WHERE ws.user.id = :userId ORDER BY ws.sessionDate")
    List<LocalDate> findAllSessionDatesByUserId(@Param("userId") UUID userId);
}
