package com.kinetic.repositories;

import com.kinetic.models.PostLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PostLikeRepository extends JpaRepository<PostLike, UUID> {

    boolean existsByPostIdAndUserId(UUID postId, UUID userId);

    void deleteByPostIdAndUserId(UUID postId, UUID userId);

    long countByPostId(UUID postId);

    @Query("SELECT l.post.id FROM PostLike l WHERE l.post.id IN :postIds AND l.user.id = :userId")
    List<UUID> findLikedPostIds(@Param("postIds") List<UUID> postIds, @Param("userId") UUID userId);

    @Query("SELECT l.post.id, COUNT(l) FROM PostLike l WHERE l.post.id IN :postIds GROUP BY l.post.id")
    List<Object[]> countByPostIds(@Param("postIds") List<UUID> postIds);
}
