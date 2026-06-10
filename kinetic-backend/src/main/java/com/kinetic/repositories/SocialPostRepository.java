package com.kinetic.repositories;

import com.kinetic.models.SocialPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SocialPostRepository extends JpaRepository<SocialPost, UUID> {

    @Query("SELECT p FROM SocialPost p WHERE p.author.id IN :authorIds ORDER BY p.createdAt DESC")
    Page<SocialPost> findFeed(@Param("authorIds") List<UUID> authorIds, Pageable pageable);
}
