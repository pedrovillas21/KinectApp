package com.kinetic.models;

import com.kinetic.enums.Role;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.springframework.lang.NonNull;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false, unique = true)
    private String email;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @Column(nullable = false)
    private String senha;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "VARCHAR(16) DEFAULT 'ALUNO'")
    private Role role = Role.ALUNO;

    @Column(name = "company_id")
    private UUID companyId;

    @Column(nullable = true)
    private String level;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    private Double weight;

    private Double height;

    private String goal;

    private Integer frequency;

    @Column(columnDefinition = "TEXT")
    private String medicalConditions;

    @Column(name = "workout_onboarding_completed", nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    private Boolean workoutOnboardingCompleted = false;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(name = "last_active")
    private LocalDateTime lastActive;

    @Column(name = "active_session_id")
    private UUID activeSessionId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    /** E-mail é NOT NULL/unique no schema; getter explícito só para expor essa garantia ao null-analysis. */
    @SuppressWarnings("null")
    public @NonNull String getEmail() {
        return email;
    }
}
