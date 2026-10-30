package com.kinetic.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/** Avaliação física do aluno (composição corporal + circunferências). Todos os campos de medida são opcionais. */
@Entity
@Table(name = "physical_assessments")
@Getter
@Setter
@NoArgsConstructor
public class PhysicalAssessment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    /** Quem avaliou; nulo se o personal apagou a conta. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trainer_id")
    private User trainer;

    @Column(name = "assessed_on", nullable = false)
    private LocalDate assessedOn;

    @Column(name = "weight_kg") private Double weightKg;
    @Column(name = "height_cm") private Double heightCm;
    @Column(name = "body_fat_pct") private Double bodyFatPct;
    @Column(name = "muscle_mass_kg") private Double muscleMassKg;
    @Column(name = "resting_hr") private Integer restingHr;

    @Column(name = "chest_cm") private Double chestCm;
    @Column(name = "waist_cm") private Double waistCm;
    @Column(name = "abdomen_cm") private Double abdomenCm;
    @Column(name = "hip_cm") private Double hipCm;
    @Column(name = "arm_right_cm") private Double armRightCm;
    @Column(name = "arm_left_cm") private Double armLeftCm;
    @Column(name = "thigh_right_cm") private Double thighRightCm;
    @Column(name = "thigh_left_cm") private Double thighLeftCm;
    @Column(name = "calf_right_cm") private Double calfRightCm;
    @Column(name = "calf_left_cm") private Double calfLeftCm;

    @Column(length = 2000)
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();
}
