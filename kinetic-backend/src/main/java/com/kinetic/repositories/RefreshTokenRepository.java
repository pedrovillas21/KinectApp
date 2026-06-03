package com.kinetic.repositories;

import com.kinetic.models.RefreshToken;
import com.kinetic.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    @Modifying
    @Transactional
    void deleteByTokenHash(String tokenHash);

    @Modifying
    @Transactional
    void deleteByUser(User user);

    // Deleção em massa via JPQL: remove todas as linhas expiradas em um único
    // statement, sem carregar entidades na memória da JVM. Retorna a contagem.
    @Modifying
    @Transactional
    @Query("DELETE FROM RefreshToken rt WHERE rt.expiryDate < :now")
    int deleteAllExpired(@Param("now") Instant now);
}
