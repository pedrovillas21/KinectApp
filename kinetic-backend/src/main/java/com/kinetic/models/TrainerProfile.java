package com.kinetic.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Perfil profissional do personal (CREF, bio, especialidades, formação e
 * atendimento), exibido ao aluno vinculado. A PK é o próprio id do usuário.
 */
@Entity
@Table(name = "trainer_profiles")
@Getter
@Setter
@NoArgsConstructor
public class TrainerProfile {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Column(length = 16)
    private String cref;

    /** Só o Kinetic marca como verificado; o personal não altera pela API. */
    @Column(name = "cref_verified", nullable = false)
    private boolean crefVerified = false;

    @Column(length = 1500)
    private String bio;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(columnDefinition = "text[]", nullable = false)
    private List<String> specialties = new ArrayList<>();

    /** Cada item é "título\ndetalhe" — ver TrainerProfileService. */
    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(columnDefinition = "text[]", nullable = false)
    private List<String> education = new ArrayList<>();

    @Column(length = 80)
    private String modality;

    @Column(length = 80)
    private String schedule;

    @Column(length = 80)
    private String location;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();
}
