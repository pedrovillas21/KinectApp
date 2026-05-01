package com.kinetic.repositories;

import com.kinetic.models.ExerciseSetLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ExerciseSetLogRepository extends JpaRepository<ExerciseSetLog, UUID> {
}
