package com.kinetic.repositories;

import com.kinetic.models.SocialPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface SocialPostRepository extends JpaRepository<SocialPost, UUID> {

    // Feed mostra apenas posts permanentes — stories (kind = 'STORY') são efêmeros
    // e exibidos no anel de squad, nunca no feed.
    // Fetch-join do autor e do treino ligado (ambos to-one, então a paginação continua no banco):
    // o card do feed lê os dois para cada post, o que antes gerava um SELECT extra por post.
    @Query(value = "SELECT p FROM SocialPost p JOIN FETCH p.author LEFT JOIN FETCH p.workoutSession "
            + "WHERE p.author.id IN :authorIds AND p.kind = 'POST' ORDER BY p.createdAt DESC",
            countQuery = "SELECT COUNT(p) FROM SocialPost p WHERE p.author.id IN :authorIds AND p.kind = 'POST'")
    Page<SocialPost> findFeed(@Param("authorIds") List<UUID> authorIds, Pageable pageable);

    // Stories ativas (não expiradas) dos autores informados, mais antigas primeiro
    // para reprodução sequencial no visualizador.
    @Query("SELECT p FROM SocialPost p WHERE p.author.id IN :authorIds AND p.kind = 'STORY' "
            + "AND p.expiresAt > :now ORDER BY p.createdAt ASC")
    List<SocialPost> findActiveStories(@Param("authorIds") List<UUID> authorIds,
                                       @Param("now") LocalDateTime now);

    // Projeção só da coluna image_url — usado pelo job de limpeza de mídia órfã
    // para construir o conjunto de keys conhecidas sem carregar entidades inteiras.
    @Query("SELECT p.imageUrl FROM SocialPost p WHERE p.imageUrl IS NOT NULL")
    List<String> findAllImageUrls();

    long countByAuthorIdAndKind(UUID authorId, String kind);

    // Stories vencidas (expiresAt < now) para o job de limpeza; em lotes via Pageable.
    // Curtidas e comentários saem junto por ON DELETE CASCADE (V11).
    List<SocialPost> findByKindAndExpiresAtBefore(String kind, LocalDateTime now, Pageable pageable);
}
