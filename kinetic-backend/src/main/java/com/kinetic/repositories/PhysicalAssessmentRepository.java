package com.kinetic.repositories;

import com.kinetic.models.PhysicalAssessment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface PhysicalAssessmentRepository extends JpaRepository<PhysicalAssessment, UUID> {

    List<PhysicalAssessment> findByStudentIdOrderByAssessedOnAscCreatedAtAsc(UUID studentId);

    /** Data da avaliação mais recente de cada aluno — caixa "Hoje" (reavaliação pendente). */
    @Query("""
            SELECT a.student.id, MAX(a.assessedOn)
            FROM PhysicalAssessment a
            WHERE a.student.id IN :studentIds
            GROUP BY a.student.id
            """)
    List<Object[]> findLatestDatePerStudent(@Param("studentIds") Collection<UUID> studentIds);
}
