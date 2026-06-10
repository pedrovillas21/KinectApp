package com.kinetic.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "social_posts")
@Getter
@Setter
@NoArgsConstructor
public class SocialPost {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private User author;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workout_session_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private WorkoutSession workoutSession;

    @Column(nullable = false)
    private String kind = "POST";

    private String category;

    private String intensity;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    private Integer calories;

    @Column(columnDefinition = "TEXT")
    private String caption;

    @Column(name = "image_url")
    private String imageUrl;

    private String badge;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
