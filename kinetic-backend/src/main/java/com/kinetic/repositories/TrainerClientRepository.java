package com.kinetic.repositories;

import jakarta.persistence.EntityNotFoundException;
import com.kinetic.enums.TrainerLinkSource;
import com.kinetic.enums.TrainerLinkStatus;
import com.kinetic.models.TrainerClient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
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

    /** Vínculos corporativos de um personal numa empresa (para encerrar quando ele sai dela). */
    List<TrainerClient> findByCompanyIdAndTrainerIdAndStatusIn(UUID companyId, UUID trainerId,
                                                              List<TrainerLinkStatus> statuses);

    boolean existsByTrainerIdAndStudentIdAndStatus(UUID trainerId, UUID studentId, TrainerLinkStatus status);

    Optional<TrainerClient> findByStudentIdAndStatus(UUID studentId, TrainerLinkStatus status);

    /** Alunos que contam no plano do personal (vínculos atribuídos pela empresa não entram). */
    long countByTrainerIdAndStatusAndSourceNot(UUID trainerId, TrainerLinkStatus status, TrainerLinkSource source);

    Optional<TrainerClient> findByTrainerIdAndStudentIdAndStatus(UUID trainerId, UUID studentId, TrainerLinkStatus status);

    /** Vínculo ATIVO do aluno; sem personal ativo → 404. */
    default TrainerClient getActiveOfStudent(UUID studentId) {
        return findByStudentIdAndStatus(studentId, TrainerLinkStatus.ATIVO)
                .orElseThrow(() -> new EntityNotFoundException("Você não possui personal ativo."));
    }

    /** Vínculo ATIVO entre o personal e o aluno; sem ele → 404 (e não 403, para não revelar o aluno). */
    default TrainerClient getActiveLink(UUID trainerId, UUID studentId) {
        return findByTrainerIdAndStudentIdAndStatus(trainerId, studentId, TrainerLinkStatus.ATIVO)
                .orElseThrow(() -> new EntityNotFoundException("Aluno não encontrado."));
    }

    /** Convites/vínculos do aluno com o personal já carregado (evita N+1). */
    @Query("SELECT tc FROM TrainerClient tc JOIN FETCH tc.trainer WHERE tc.student.id = :studentId AND tc.status = :status ORDER BY tc.createdAt DESC")
    List<TrainerClient> findByStudentAndStatusFetchTrainer(@Param("studentId") UUID studentId,
                                                           @Param("status") TrainerLinkStatus status);

    /** Alunos do personal com o aluno já carregado (evita N+1). */
    @Query("SELECT tc FROM TrainerClient tc JOIN FETCH tc.student WHERE tc.trainer.id = :trainerId AND tc.status = :status ORDER BY tc.createdAt DESC")
    List<TrainerClient> findByTrainerAndStatusFetchStudent(@Param("trainerId") UUID trainerId,
                                                           @Param("status") TrainerLinkStatus status);

    // ── Painel EMPRESA: vínculos corporativos (source=COMPANY) ──────────────

    /** Vínculos da empresa num dado status, com aluno e personal carregados (evita N+1). */
    @Query("SELECT tc FROM TrainerClient tc JOIN FETCH tc.student JOIN FETCH tc.trainer WHERE tc.companyId = :companyId AND tc.status = :status ORDER BY tc.createdAt DESC")
    List<TrainerClient> findByCompanyAndStatusFetch(@Param("companyId") UUID companyId,
                                                    @Param("status") TrainerLinkStatus status);

    // Analytics por lista de empresas: uma filial ou a rede inteira na mesma consulta.

    long countByCompanyIdInAndStatus(Collection<UUID> companyIds, TrainerLinkStatus status);

    long countByCompanyIdInAndCreatedAtGreaterThanEqual(Collection<UUID> companyIds, LocalDateTime start);

    long countByCompanyIdInAndStatusAndCreatedAtGreaterThanEqual(
            Collection<UUID> companyIds, TrainerLinkStatus status, LocalDateTime start);

    @Query("SELECT tc.student.id FROM TrainerClient tc WHERE tc.companyId IN :companyIds AND tc.status = :status")
    List<UUID> findStudentIdsByCompanies(@Param("companyIds") Collection<UUID> companyIds,
                                         @Param("status") TrainerLinkStatus status);

    /** Nº de alunos ATIVOS por instrutor das empresas (gráfico "desempenho por instrutor"). */
    @Query("SELECT tc.trainer.id, tc.trainer.nome, COUNT(tc) FROM TrainerClient tc "
            + "WHERE tc.companyId IN :companyIds AND tc.status = :status "
            + "GROUP BY tc.trainer.id, tc.trainer.nome ORDER BY COUNT(tc) DESC")
    List<Object[]> countActiveStudentsPerTrainer(@Param("companyIds") Collection<UUID> companyIds,
                                                 @Param("status") TrainerLinkStatus status);
}
