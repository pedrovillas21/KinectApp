package com.kinetic.repositories;

import com.kinetic.enums.TrainerLinkStatus;
import com.kinetic.models.TrainerClient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TrainerClientRepository extends JpaRepository<TrainerClient, UUID> {

    /**
     * Regra de cardinalidade: 1 personal ATIVO por aluno. O filtro por status
     * é explícito — vínculos PENDENTE/RECUSADO/ENCERRADO não bloqueiam convite.
     * (Sob concorrência, quem garante é o índice único parcial do banco.)
     */
    boolean existsByStudentIdAndStatus(UUID studentId, TrainerLinkStatus status);

    boolean existsByTrainerIdAndStudentIdAndStatus(UUID trainerId, UUID studentId, TrainerLinkStatus status);

    Optional<TrainerClient> findByStudentIdAndStatus(UUID studentId, TrainerLinkStatus status);

    /** Convites/vínculos do aluno com o personal já carregado (evita N+1). */
    @Query("SELECT tc FROM TrainerClient tc JOIN FETCH tc.trainer WHERE tc.student.id = :studentId AND tc.status = :status ORDER BY tc.createdAt DESC")
    List<TrainerClient> findByStudentAndStatusFetchTrainer(@Param("studentId") UUID studentId,
                                                           @Param("status") TrainerLinkStatus status);

    /** Alunos do personal com o aluno já carregado (evita N+1). */
    @Query("SELECT tc FROM TrainerClient tc JOIN FETCH tc.student WHERE tc.trainer.id = :trainerId AND tc.status = :status ORDER BY tc.createdAt DESC")
    List<TrainerClient> findByTrainerAndStatusFetchStudent(@Param("trainerId") UUID trainerId,
                                                           @Param("status") TrainerLinkStatus status);

    /** Vínculo ATIVO entre o par (em qualquer papel) — guard de posse do chat. */
    @Query("""
            SELECT COUNT(tc) > 0 FROM TrainerClient tc
            WHERE tc.status = com.kinetic.enums.TrainerLinkStatus.ATIVO
              AND ((tc.trainer.id = :a AND tc.student.id = :b) OR (tc.trainer.id = :b AND tc.student.id = :a))
            """)
    boolean existsActiveLinkBetween(@Param("a") UUID a, @Param("b") UUID b);

    // ── Painel EMPRESA: vínculos corporativos (source=COMPANY) ──────────────

    /** Vínculos da empresa num dado status, com aluno e personal carregados (evita N+1). */
    @Query("SELECT tc FROM TrainerClient tc JOIN FETCH tc.student JOIN FETCH tc.trainer WHERE tc.companyId = :companyId AND tc.status = :status ORDER BY tc.createdAt DESC")
    List<TrainerClient> findByCompanyAndStatusFetch(@Param("companyId") UUID companyId,
                                                    @Param("status") TrainerLinkStatus status);

    long countByCompanyIdAndStatus(UUID companyId, TrainerLinkStatus status);

    long countByCompanyIdAndCreatedAtGreaterThanEqual(UUID companyId, LocalDateTime start);

    long countByCompanyIdAndStatusAndCreatedAtGreaterThanEqual(
            UUID companyId, TrainerLinkStatus status, LocalDateTime start);

    /** Nº de alunos ATIVOS por instrutor da empresa (gráfico "desempenho por instrutor"). */
    @Query("SELECT tc.trainer.id, tc.trainer.nome, COUNT(tc) FROM TrainerClient tc "
            + "WHERE tc.companyId = :companyId AND tc.status = :status "
            + "GROUP BY tc.trainer.id, tc.trainer.nome ORDER BY COUNT(tc) DESC")
    List<Object[]> countActiveStudentsPerTrainer(@Param("companyId") UUID companyId,
                                                 @Param("status") TrainerLinkStatus status);
}
