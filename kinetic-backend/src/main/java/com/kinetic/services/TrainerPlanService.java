package com.kinetic.services;

import com.kinetic.dtos.TrainerExerciseRequestDTO;
import com.kinetic.enums.LoadType;
import com.kinetic.dtos.TrainerWorkoutPlanRequestDTO;
import com.kinetic.dtos.WorkoutPlanResponseDTO;
import com.kinetic.models.Exercise;
import com.kinetic.models.User;
import com.kinetic.models.WorkoutPlan;
import com.kinetic.repositories.UserRepository;
import com.kinetic.repositories.WorkoutPlanRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Fichas que o personal monta e edita para um aluno da carteira (painel desktop).
 * Toda operação passa pelo gate de posse do {@link TrainerLinkService}: sem vínculo
 * ATIVO, 404.
 */
@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class TrainerPlanService {

    private static final Set<String> LEVELS = Set.of("INICIANTE", "INTERMEDIÁRIO", "PRO");
    private static final String DEFAULT_LEVEL = "INTERMEDIÁRIO";
    private static final Set<String> SECTIONS = Set.of("AQUECIMENTO", "PRINCIPAL", "FINALIZACAO");
    private static final String DEFAULT_SECTION = "PRINCIPAL";
    private static final int SUBTITLE_MAX = 120;

    private final TrainerLinkService trainerLinkService;
    private final WorkoutService workoutService;
    private final WorkoutPlanRepository workoutPlanRepository;
    private final UserRepository userRepository;

    /** Fichas vigentes do aluno, na mesma forma que o app recebe em /workouts/my-plans. */
    @Transactional(readOnly = true)
    public List<WorkoutPlanResponseDTO> listPlans(String trainerEmail, @NonNull UUID studentId) {
        User student = trainerLinkService.resolveOwnedStudent(trainerEmail, studentId);
        return workoutService.getMyPlans(student.getEmail());
    }

    @Transactional
    public WorkoutPlanResponseDTO createPlan(String trainerEmail, @NonNull UUID studentId,
                                             TrainerWorkoutPlanRequestDTO request) {
        User student = trainerLinkService.resolveOwnedStudent(trainerEmail, studentId);
        WorkoutPlan plan = buildPlan(student, userRepository.getByEmailOrThrow(trainerEmail), request);
        return WorkoutPlanResponseDTO.fromEntity(workoutPlanRepository.save(plan));
    }

    /** Ficha nova do personal para o aluno, ainda não salva (também usada na aprovação de fichas da IA). */
    WorkoutPlan buildPlan(User student, User trainer, TrainerWorkoutPlanRequestDTO request) {
        WorkoutPlan plan = new WorkoutPlan();
        plan.setUser(student);
        plan.setCreatedBy(trainer);
        applyPlanFields(plan, request, student);

        // Na criação os ids são ignorados: o painel pode duplicar uma ficha existente.
        int order = 0;
        for (TrainerExerciseRequestDTO dto : request.exercises()) {
            Exercise exercise = new Exercise();
            exercise.setWorkoutPlan(plan);
            applyExerciseFields(exercise, dto, order++);
            plan.getExercises().add(exercise);
        }
        return plan;
    }

    /**
     * Substitui o conteúdo da ficha pelo enviado. Exercícios com id são atualizados no
     * lugar (o histórico de séries do aluno continua apontando para eles); os que não
     * vieram na requisição são arquivados, nunca apagados.
     */
    @Transactional
    public WorkoutPlanResponseDTO updatePlan(String trainerEmail, @NonNull UUID studentId,
                                             @NonNull UUID planId, TrainerWorkoutPlanRequestDTO request) {
        User student = trainerLinkService.resolveOwnedStudent(trainerEmail, studentId);
        WorkoutPlan plan = findOwnedActivePlan(student, planId);

        // Editar uma ficha da IA a torna do personal: passa a exibir "prescrito por" no app
        // e bloqueia a regeneração por IA, que arquivaria o trabalho dele.
        plan.setCreatedBy(userRepository.getByEmailOrThrow(trainerEmail));
        applyPlanFields(plan, request, student);

        Map<UUID, Exercise> remaining = new HashMap<>();
        for (Exercise exercise : plan.getExercises()) {
            remaining.put(exercise.getId(), exercise);
        }

        int order = 0;
        for (TrainerExerciseRequestDTO dto : request.exercises()) {
            Exercise exercise;
            if (dto.id() != null) {
                exercise = remaining.remove(dto.id());
                if (exercise == null) {
                    throw new IllegalArgumentException(
                            "Um dos exercícios não pertence mais a esta ficha. Recarregue a página e tente de novo.");
                }
            } else {
                exercise = new Exercise();
                exercise.setWorkoutPlan(plan);
                plan.getExercises().add(exercise);
            }
            applyExerciseFields(exercise, dto, order++);
        }

        // Continuam na coleção em memória (sem orphanRemoval); o flush grava archived = true.
        remaining.values().forEach(exercise -> exercise.setArchived(true));

        return WorkoutPlanResponseDTO.fromEntity(plan);
    }

    /** Tira a ficha do app do aluno. Arquiva: sessões já registradas continuam apontando para ela. */
    @Transactional
    public void archivePlan(String trainerEmail, @NonNull UUID studentId, @NonNull UUID planId) {
        User student = trainerLinkService.resolveOwnedStudent(trainerEmail, studentId);
        findOwnedActivePlan(student, planId).setStatus("archived");
    }

    private WorkoutPlan findOwnedActivePlan(User student, UUID planId) {
        return workoutPlanRepository.findById(planId)
                .filter(plan -> plan.getUser().getId().equals(student.getId()))
                .filter(plan -> "active".equals(plan.getStatus()))
                .orElseThrow(() -> new EntityNotFoundException("Ficha não encontrada."));
    }

    private void applyPlanFields(WorkoutPlan plan, TrainerWorkoutPlanRequestDTO request, User student) {
        plan.setTitle(request.title().trim());
        plan.setTag(upperOrNull(request.tag()));
        plan.setLevel(resolveLevel(request.level(), plan.getLevel(), student.getLevel()));
        plan.setEstimatedDurationMinutes(request.estimatedDurationMinutes());

        String subtitle = trimOrNull(request.subtitle());
        plan.setSubtitle(subtitle != null ? subtitle : subtitleFromMuscles(request.exercises()));
    }

    private void applyExerciseFields(Exercise exercise, TrainerExerciseRequestDTO dto, int sortOrder) {
        exercise.setName(dto.name().trim());
        exercise.setMuscles(upperOrNull(dto.muscles()));
        exercise.setType(upperOrNull(dto.type()));
        exercise.setSets(dto.sets());
        exercise.setReps(dto.reps().trim());
        exercise.setWeight(trimOrNull(dto.weight()));
        exercise.setLoadType(dto.loadType() != null ? dto.loadType() : LoadType.infer(dto.weight()));
        exercise.setRestTime(trimOrNull(dto.restTime()));
        exercise.setSection(resolveSection(dto.section()));
        exercise.setNotes(trimOrNull(dto.notes()));
        exercise.setSortOrder(sortOrder);
    }

    /** Nível explícito > nível atual da ficha > nível do aluno > padrão. */
    static String resolveLevel(String requested, String current, String studentLevel) {
        String level = upperOrNull(requested);
        if (level != null) {
            if ("INTERMEDIARIO".equals(level)) level = "INTERMEDIÁRIO";
            if (!LEVELS.contains(level)) {
                throw new IllegalArgumentException("Nível inválido. Use INICIANTE, INTERMEDIÁRIO ou PRO.");
            }
            return level;
        }
        if (current != null) return current;
        String fromStudent = upperOrNull(studentLevel);
        if ("INTERMEDIARIO".equals(fromStudent)) fromStudent = "INTERMEDIÁRIO";
        return fromStudent != null && LEVELS.contains(fromStudent) ? fromStudent : DEFAULT_LEVEL;
    }

    private static String resolveSection(String requested) {
        String section = upperOrNull(requested);
        if (section == null) return DEFAULT_SECTION;
        if (!SECTIONS.contains(section)) {
            throw new IllegalArgumentException("Seção inválida. Use AQUECIMENTO, PRINCIPAL ou FINALIZACAO.");
        }
        return section;
    }

    /** "PEITO / OMBRO / TRICEPS", no mesmo formato do subtítulo das fichas da IA. */
    private static String subtitleFromMuscles(List<TrainerExerciseRequestDTO> exercises) {
        LinkedHashSet<String> muscles = new LinkedHashSet<>();
        for (TrainerExerciseRequestDTO dto : exercises) {
            String muscle = upperOrNull(dto.muscles());
            if (muscle != null) muscles.add(muscle);
        }
        if (muscles.isEmpty()) return null;
        String subtitle = String.join(" / ", muscles);
        return subtitle.length() > SUBTITLE_MAX ? subtitle.substring(0, SUBTITLE_MAX) : subtitle;
    }

    private static String trimOrNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static String upperOrNull(String value) {
        String trimmed = trimOrNull(value);
        return trimmed == null ? null : trimmed.toUpperCase(Locale.ROOT);
    }
}
