package com.kinetic.models;

import com.kinetic.enums.LoadType;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "exercises")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Exercise {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    private String muscles;

    private String type;

    private Integer sets;

    private String reps;

    private String weight;

    /** Nulo em linhas antigas: use {@link #effectiveLoadType()}. */
    @Enumerated(EnumType.STRING)
    @Column(name = "load_type", length = 16)
    private LoadType loadType;

    @Column(name = "rest_time")
    private String restTime;

    // Secao logica dentro da ficha: AQUECIMENTO | PRINCIPAL | FINALIZACAO.
    // Classificada pela IA na geracao. Nullable para fichas antigas (fallback no front).
    private String section;

    // Observacoes do personal (execucao, cadencia, ajustes). Null em fichas da IA.
    @Column(columnDefinition = "TEXT")
    private String notes;

    // Ordem de exibicao na ficha. Null em fichas antigas (ordem de insercao).
    @Column(name = "sort_order")
    private Integer sortOrder;

    // Removido da ficha pelo personal. Nunca apagamos a linha: os setLogs do aluno a referenciam.
    @Column(nullable = false)
    private boolean archived = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workout_plan_id", nullable = false)
    @JsonIgnore
    private WorkoutPlan workoutPlan;

    @OneToMany(mappedBy = "exercise", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ExerciseSetLog> setLogs = new ArrayList<>();

    public LoadType effectiveLoadType() {
        return loadType != null ? loadType : LoadType.infer(weight);
    }
}
