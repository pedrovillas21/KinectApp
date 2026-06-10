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
    @Query("SELECT p FROM SocialPost p WHERE p.author.id IN :authorIds AND p.kind = 'POST' ORDER BY p.createdAt DESC")
    Page<SocialPost> findFeed(@Param("authorIds") List<UUID> authorIds, Pageable pageable);

    // Stories ativas (não expiradas) dos autores informados, mais antigas primeiro
    // para reprodução sequencial no visualizador.
    @Query("SELECT p FROM SocialPost p WHERE p.author.id IN :authorIds AND p.kind = 'STORY' "
            + "AND p.expiresAt > :now ORDER BY p.createdAt ASC")
    List<SocialPost> findActiveStories(@Param("authorIds") List<UUID> authorIds,
                                       @Param("now") LocalDateTime now);
}
