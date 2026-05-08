package com.kinetic.repositories;

import com.kinetic.models.Exercise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ExerciseRepository extends JpaRepository<Exercise, UUID> {

    /**
     * Retorna os grupos musculares distintos presentes nos planos de treino do usuário.
     * Usado para identificar quais grupos foram planejados mas não treinados no período (isRest).
     */
    @Query("SELECT DISTINCT e.muscles FROM Exercise e WHERE e.workoutPlan.user.id = :userId AND e.muscles IS NOT NULL")
    List<String> findDistinctMusclesByUserId(@Param("userId") UUID userId);
}
