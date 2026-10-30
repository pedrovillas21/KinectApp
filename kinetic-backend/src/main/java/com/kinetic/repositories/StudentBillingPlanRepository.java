package com.kinetic.repositories;

import com.kinetic.models.StudentBillingPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StudentBillingPlanRepository extends JpaRepository<StudentBillingPlan, UUID> {

    Optional<StudentBillingPlan> findByTrainerIdAndStudentId(UUID trainerId, UUID studentId);

    /** Mensalidades ativas do personal com o aluno já carregado (evita N+1). */
    @Query("SELECT p FROM StudentBillingPlan p JOIN FETCH p.student WHERE p.trainer.id = :trainerId AND p.active = true")
    List<StudentBillingPlan> findActiveByTrainerFetchStudent(@Param("trainerId") UUID trainerId);
}
