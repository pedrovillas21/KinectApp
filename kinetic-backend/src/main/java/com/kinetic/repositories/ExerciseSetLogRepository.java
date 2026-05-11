package com.kinetic.repositories;

import com.kinetic.models.ExerciseSetLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
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
}
