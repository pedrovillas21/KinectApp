package com.kinetic.services;

import com.kinetic.dtos.GenerateWorkoutRequestDto;
import com.kinetic.dtos.GeneratedExerciseDto;
import com.kinetic.dtos.GeneratedWorkoutPlanDto;
import com.kinetic.dtos.WorkoutPlanResponseDTO;
import com.kinetic.models.Exercise;
import com.kinetic.models.User;
import com.kinetic.models.WorkoutPlan;
import com.kinetic.repositories.UserRepository;
import com.kinetic.repositories.WorkoutExecutionLogRepository;
import com.kinetic.repositories.WorkoutPlanRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
public class WorkoutService {

    private final GeminiService geminiService;
    private final WorkoutPlanRepository workoutPlanRepository;
    private final UserRepository userRepository;
    private final PlanCycleSnapshotService planCycleSnapshotService;
    private final WorkoutExecutionLogRepository workoutExecutionLogRepository;

    public WorkoutService(GeminiService geminiService,
                          WorkoutPlanRepository workoutPlanRepository,
                          UserRepository userRepository,
                          PlanCycleSnapshotService planCycleSnapshotService,
                          WorkoutExecutionLogRepository workoutExecutionLogRepository) {
        this.geminiService = geminiService;
        this.workoutPlanRepository = workoutPlanRepository;
        this.userRepository = userRepository;
        this.planCycleSnapshotService = planCycleSnapshotService;
        this.workoutExecutionLogRepository = workoutExecutionLogRepository;
    }

    @Transactional
    public List<WorkoutPlanResponseDTO> generateWorkoutForUser(String userEmail, GenerateWorkoutRequestDto request) {
        log.info("Iniciando requisição de geração para o usuário: {}", userEmail);
        validateRequest(request);

        int age = Period.between(request.birthDate(), LocalDate.now()).getYears();
        if (age < 0) {
            throw new IllegalArgumentException("Data de nascimento nao pode ser no futuro.");
        }
        if (age < 10 || age > 120) {
            throw new IllegalArgumentException("Idade derivada (%d anos) esta fora do intervalo permitido (10-120).".formatted(age));
        }

        User user = findUserByEmail(userEmail);
        log.info("Usuário encontrado. Atualizando perfil... (Idade calculada com data {}: {} anos)", request.birthDate(), age);

        // Captura estado pré-regeneração antes de sobrescrever o perfil
        String oldGoal = user.getGoal();
        double oldWeight = user.getWeight() != null ? user.getWeight() : 0.0;
        Optional<java.time.LocalDateTime> earliestActivePlan =
                workoutPlanRepository.findEarliestActiveCreatedAt(user.getId());

        double heightCm = request.height() < 3 ? request.height() * 100 : request.height();

        log.info("Perfil verificado. Prompto sendo montado e chamando API do Gemini...");
        List<GeneratedWorkoutPlanDto> generatedDtos = geminiService.generateWorkoutPlan(
                request.level(),
                age,
                request.weight(),
                heightCm,
                request.goal(),
                request.frequency(),
                request.medicalConditions()
        );

        log.info("Resposta do Gemini recebida com sucesso. Salvando entidades...");
        if (generatedDtos == null || generatedDtos.isEmpty()) {
            throw new IllegalStateException("Falha na geração: a lista de planos está nula ou vazia.");
        }

        List<WorkoutPlan> workoutPlansToSave = new ArrayList<>();
        for (GeneratedWorkoutPlanDto generatedDto : generatedDtos) {
            if (generatedDto.title() == null || generatedDto.title().isBlank()) {
                throw new IllegalStateException("Falha na geração: plano de treino com título inválido.");
            }
            if (generatedDto.data() == null || generatedDto.data().isEmpty()) {
                throw new IllegalStateException("Falha na geração: plano de treino sem exercícios.");
            }

            WorkoutPlan workoutPlan = new WorkoutPlan();
            workoutPlan.setTitle(generatedDto.title());
            workoutPlan.setSubtitle(generatedDto.subtitle());
            workoutPlan.setTag(generatedDto.tag());
            workoutPlan.setLevel(request.level());
            workoutPlan.setEstimatedDurationMinutes(generatedDto.estimatedDurationMinutes());
            workoutPlan.setUser(user);

            for (GeneratedExerciseDto exDto : generatedDto.data()) {
                if (exDto.name() == null || exDto.name().isBlank() || exDto.sets() == null || exDto.reps() == null) {
                    throw new IllegalStateException("Falha na geração: exercício com campos obrigatórios ausentes.");
                }
                Exercise exercise = new Exercise();
                exercise.setName(exDto.name());
                exercise.setMuscles(exDto.muscles());
                exercise.setType(exDto.type());
                exercise.setSets(exDto.sets());
                exercise.setReps(exDto.reps());
                exercise.setWeight(exDto.weight());
                exercise.setRestTime(exDto.restTime());
                exercise.setWorkoutPlan(workoutPlan);
                workoutPlan.getExercises().add(exercise);
            }

            workoutPlansToSave.add(workoutPlan);
        }

        user.setBirthDate(request.birthDate());
        user.setWeight(request.weight());
        user.setHeight(heightCm);
        user.setGoal(request.goal());
        user.setFrequency(request.frequency());
        user.setLevel(request.level());
        if (request.medicalConditions() != null) {
            user.setMedicalConditions(request.medicalConditions());
        }
        user.setWorkoutOnboardingCompleted(true);
        userRepository.save(user);

        // Se havia plano ativo, captura snapshot do ciclo encerrado antes de arquivar.
        // Ocorre dentro da mesma @Transactional — falha reverte snapshot + archiveActivePlans juntos.
        earliestActivePlan.ifPresent(cycleStartDateTime -> {
            if (oldGoal != null && !oldGoal.isBlank()) {
                planCycleSnapshotService.captureSnapshot(
                        user,
                        cycleStartDateTime.toLocalDate(),
                        oldGoal,
                        oldWeight
                );
            }
        });

        // Arquiva o plano vigente (preserva historico) antes de promover o novo a 'active'.
        // Apos a geracao bem-sucedida do Gemini, ja na mesma transacao: se algo falhar, tudo reverte.
        workoutPlanRepository.archiveActivePlans(user.getId());

        List<WorkoutPlan> savedPlans = workoutPlanRepository.saveAll(workoutPlansToSave);

        return savedPlans.stream()
                .map(WorkoutPlanResponseDTO::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<WorkoutPlanResponseDTO> getMyPlans(String userEmail) {
        User user = findUserByEmail(userEmail);

        // Uma unica query agregada (sem N+1): ultima conclusao por plano do usuario.
        Map<UUID, LocalDateTime> lastCompletionByPlan = buildLastCompletionMap(user.getId());

        return workoutPlanRepository.findByUserIdAndStatus(user.getId(), "active").stream()
                .map(plan -> WorkoutPlanResponseDTO.fromEntity(plan, lastCompletionByPlan.get(plan.getId())))
                .toList();
    }

    /**
     * Monta o mapa plano -> ultima data de conclusao a partir da query agregada.
     * Cast defensivo: MAX(completionDate) pode voltar como java.sql.Timestamp ou
     * LocalDateTime dependendo da versao do driver do PostgreSQL.
     */
    private Map<UUID, LocalDateTime> buildLastCompletionMap(UUID userId) {
        Map<UUID, LocalDateTime> map = new HashMap<>();
        for (Object[] row : workoutExecutionLogRepository.findLatestCompletionPerPlan(userId)) {
            UUID planId = (UUID) row[0];
            Object raw = row[1];
            if (raw == null) continue;
            LocalDateTime last = (raw instanceof java.sql.Timestamp ts)
                    ? ts.toLocalDateTime()
                    : (LocalDateTime) raw;
            map.put(planId, last);
        }
        return map;
    }

    private User findUserByEmail(String userEmail) {
        return userRepository.getByEmailOrThrow(userEmail);
    }

    private void validateRequest(GenerateWorkoutRequestDto request) {
        if (request.birthDate() == null) {
            throw new IllegalArgumentException("Campo 'birthDate' e obrigatorio.");
        }
        if (request.weight() == null || request.weight() <= 0) {
            throw new IllegalArgumentException("Campo 'weight' deve ser um valor positivo.");
        }
        if (request.height() == null || request.height() <= 0) {
            throw new IllegalArgumentException("Campo 'height' deve ser um valor positivo.");
        }
        if (request.goal() == null || request.goal().isBlank()) {
            throw new IllegalArgumentException("Campo 'goal' e obrigatorio.");
        }
        if (request.frequency() == null || request.frequency() < 1 || request.frequency() > 7) {
            throw new IllegalArgumentException("Campo 'frequency' deve ser entre 1 e 7.");
        }
        if (request.level() == null || request.level().isBlank()) {
            throw new IllegalArgumentException("Campo 'level' e obrigatorio.");
        }
    }
}
