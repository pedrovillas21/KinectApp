package com.kinetic.repositories;

import com.kinetic.models.OneTimeCode;
import com.kinetic.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.NoRepositoryBean;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/** Consultas comuns às tabelas de códigos por e-mail ({@code #{#entityName}} vira a entidade concreta). */
@NoRepositoryBean
public interface OneTimeCodeRepository<T extends OneTimeCode> extends JpaRepository<T, UUID> {

    Optional<T> findByUser(User user);

    // flush imediato: o insert do código novo (mesma user_id, coluna UNIQUE)
    // vem logo em seguida na mesma transação.
    @Modifying(flushAutomatically = true)
    @Transactional
    @Query("DELETE FROM #{#entityName} c WHERE c.user = :user")
    void deleteByUser(@Param("user") User user);

    /**
     * Conta uma tentativa de forma atômica, antes de conferir o código. O UPDATE trava
     * a linha até o fim da transação, então requisições paralelas não leem o mesmo
     * contador. 0 linhas: código vencido, esgotado ou já usado.
     */
    @Modifying
    @Query("UPDATE #{#entityName} c SET c.attempts = c.attempts + 1 "
            + "WHERE c.id = :id AND c.attempts < :max AND c.expiresAt > :now")
    int reserveAttempt(@Param("id") UUID id, @Param("max") int max, @Param("now") Instant now);

    @Modifying
    @Transactional
    @Query("DELETE FROM #{#entityName} c WHERE c.expiresAt < :now")
    int deleteAllExpired(@Param("now") Instant now);
}
