package com.kinetic.repositories;

import com.kinetic.models.WorkoutPlan;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WorkoutPlanRepository extends JpaRepository<WorkoutPlan, UUID> {
    @EntityGraph(attributePaths = "exercises")
    List<WorkoutPlan> findByUserId(UUID userId);
}
