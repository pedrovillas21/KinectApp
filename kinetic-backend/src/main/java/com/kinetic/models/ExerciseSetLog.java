package com.kinetic.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "exercise_set_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ExerciseSetLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "set_number", nullable = false)
    private Integer setNumber;

    @Column(name = "reps_performed", nullable = false)
    private Integer repsPerformed;

    @Column(name = "weight_used", nullable = false)
    private Double weightUsed;

    @Column(name = "logged_at", nullable = false, updatable = false)
    private LocalDateTime loggedAt = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exercise_id", nullable = false)
    @JsonIgnore
    private Exercise exercise;
}
