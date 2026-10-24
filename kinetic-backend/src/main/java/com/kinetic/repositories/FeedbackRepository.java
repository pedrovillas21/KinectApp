package com.kinetic.repositories;

import com.kinetic.models.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, UUID> {

    /** Feedbacks recebidos por uma empresa, com aluno e personal carregados. */
    @Query("SELECT f FROM Feedback f JOIN FETCH f.student JOIN FETCH f.personal WHERE f.companyId = :companyId ORDER BY f.createdAt DESC")
    List<Feedback> findByCompanyFetch(@Param("companyId") UUID companyId);
}
