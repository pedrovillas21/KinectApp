package com.kinetic.repositories;

import com.kinetic.models.ExerciseSetLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface ExerciseSetLogRepository extends JpaRepository<ExerciseSetLog, UUID> {

    /**
     * Agrega volume (reps * peso) por grupo muscular para um usuário em um intervalo de datas.
     * O cálculo é feito inteiramente no banco para evitar carregar linhas para a JVM.
     * Retorna Object[]{muscleGroup: String, totalVolume: Double}.
     */
    @Query("""
            SELECT e.muscles, SUM(sl.repsPerformed * sl.weightUsed)
            FROM ExerciseSetLog sl
            JOIN sl.exercise e
            JOIN sl.workoutSession ws
            WHERE ws.user.id = :userId
              AND ws.sessionDate BETWEEN :startDate AND :endDate
            GROUP BY e.muscles
            """)
    List<Object[]> findVolumeByMuscleGroupBetween(
            @Param("userId")    UUID userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate")   LocalDate endDate
    );

    /** Volume total (reps * peso, em kg) de um usuário no intervalo de datas (inclusivo). */
    @Query("""
            SELECT COALESCE(SUM(sl.repsPerformed * sl.weightUsed), 0.0)
            FROM ExerciseSetLog sl
            JOIN sl.workoutSession ws
            WHERE ws.user.id = :userId
              AND ws.sessionDate BETWEEN :startDate AND :endDate
            """)
    Double sumVolumeForUserBetween(
            @Param("userId")    UUID userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate")   LocalDate endDate
    );

    /**
     * Maior carga já usada por exercício antes de {@code before} (exclusivo). Agrupa pelo
     * nome cru do exercício; o chamador normaliza (cada ficha nova cria Exercise novo).
     * Retorna Object[]{exerciseName: String, maxWeight: Double}.
     */
    @Query("""
            SELECT e.name, MAX(sl.weightUsed)
            FROM ExerciseSetLog sl
            JOIN sl.exercise e
            JOIN sl.workoutSession ws
            WHERE ws.user.id = :userId
              AND ws.sessionDate < :before
            GROUP BY e.name
            """)
    List<Object[]> maxWeightPerExerciseBefore(
            @Param("userId") UUID userId,
            @Param("before") LocalDate before
    );

    /** Séries das sessões informadas com exercício e ficha já carregados (cards do feed/perfil, sem N+1). */
    @Query("""
            SELECT sl
            FROM ExerciseSetLog sl
            JOIN FETCH sl.exercise e
            JOIN FETCH e.workoutPlan
            WHERE sl.workoutSession.id IN :sessionIds
            """)
    List<ExerciseSetLog> findWithExerciseBySessionIds(@Param("sessionIds") Collection<UUID> sessionIds);

    /**
     * Combinações distintas (exercício, carga, reps) do usuário com a primeira data em que
     * aconteceram — base dos recordes por exercício do perfil e do comparar.
     * Retorna Object[]{exerciseName: String, weight: Double, reps: Integer, firstDate: LocalDate}.
     */
    @Query("""
            SELECT e.name, sl.weightUsed, sl.repsPerformed, MIN(ws.sessionDate)
            FROM ExerciseSetLog sl
            JOIN sl.exercise e
            JOIN sl.workoutSession ws
            WHERE ws.user.id = :userId
            GROUP BY e.name, sl.weightUsed, sl.repsPerformed
            """)
    List<Object[]> findDistinctSetsForUser(@Param("userId") UUID userId);

    /** Volume (kg) por dia de treino do usuário, em ordem cronológica — conquistas de volume acumulado. */
    @Query("""
            SELECT ws.sessionDate, COALESCE(SUM(sl.repsPerformed * sl.weightUsed), 0.0)
            FROM ExerciseSetLog sl
            JOIN sl.workoutSession ws
            WHERE ws.user.id = :userId
            GROUP BY ws.sessionDate
            ORDER BY ws.sessionDate
            """)
    List<Object[]> sumVolumePerDayForUser(@Param("userId") UUID userId);
}
