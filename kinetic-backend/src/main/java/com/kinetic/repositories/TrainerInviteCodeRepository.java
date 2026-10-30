package com.kinetic.repositories;

import com.kinetic.models.TrainerInviteCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TrainerInviteCodeRepository extends JpaRepository<TrainerInviteCode, UUID> {

    @Query("SELECT c FROM TrainerInviteCode c JOIN FETCH c.trainer WHERE c.codeHash = :hash")
    Optional<TrainerInviteCode> findByCodeHashFetchTrainer(@Param("hash") String hash);

    /** Convites ainda não resgatados do personal (vencidos inclusos, para o personal renovar). */
    @Query("SELECT c FROM TrainerInviteCode c WHERE c.trainer.id = :trainerId AND c.redeemedAt IS NULL "
            + "ORDER BY c.createdAt DESC")
    List<TrainerInviteCode> findOpenByTrainer(@Param("trainerId") UUID trainerId);

    @Query("SELECT COUNT(c) FROM TrainerInviteCode c WHERE c.trainer.id = :trainerId "
            + "AND c.redeemedAt IS NULL AND c.expiresAt > :now")
    long countActiveByTrainer(@Param("trainerId") UUID trainerId, @Param("now") Instant now);

    /**
     * Consome o código de forma atômica: só um resgate concorrente vê 1 linha
     * afetada; o outro vê 0 e é recusado.
     */
    @Modifying(flushAutomatically = true)
    @Query("UPDATE TrainerInviteCode c SET c.redeemedAt = :now, c.redeemedBy = :studentId "
            + "WHERE c.id = :id AND c.redeemedAt IS NULL AND c.expiresAt > :now")
    int markRedeemed(@Param("id") UUID id, @Param("studentId") UUID studentId, @Param("now") Instant now);

    /** Limpeza: convites vencidos há mais de 30 dias e nunca usados. */
    @Modifying
    @Transactional
    @Query("DELETE FROM TrainerInviteCode c WHERE c.redeemedAt IS NULL AND c.expiresAt < :cutoff")
    int deleteExpiredBefore(@Param("cutoff") Instant cutoff);
}
