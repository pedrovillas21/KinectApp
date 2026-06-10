package com.kinetic.models;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "plan_cycle_snapshots")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PlanCycleSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "cycle_start_date", nullable = false)
    private LocalDate cycleStartDate;

    @Column(name = "cycle_end_date", nullable = false)
    private LocalDate cycleEndDate;

    @Column(nullable = false)
    private String goal;

    @Column(name = "end_weight")
    private Double endWeight;

    @Column(name = "total_volume")
    private Double totalVolume;

    @Column(name = "completed_sessions")
    private Integer completedSessions;

    @Column(name = "target_sessions")
    private Integer targetSessions;

    @Column(name = "adherence_percentage")
    private Integer adherencePercentage;

    @Column(name = "volume_by_muscle", columnDefinition = "TEXT")
    private String volumeByMuscle;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
