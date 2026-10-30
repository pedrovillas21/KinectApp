package com.kinetic.services;

import lombok.RequiredArgsConstructor;
import com.kinetic.utils.AppTime;

import com.kinetic.dtos.GenerateWorkoutRequestDto;
import com.kinetic.dtos.GeneratedExerciseDto;
import com.kinetic.enums.LoadType;
import com.kinetic.dtos.GeneratedWorkoutPlanDto;
import com.kinetic.dtos.WorkoutPlanResponseDTO;
import com.kinetic.enums.TrainerLinkStatus;
import com.kinetic.exceptions.AiQuotaExceededException;
import com.kinetic.exceptions.TrainerManagedPlanException;
import com.kinetic.models.Exercise;
import com.kinetic.models.User;
import com.kinetic.models.WorkoutPlan;
import com.kinetic.repositories.TrainerClientRepository;
import com.kinetic.repositories.UserRepository;
import com.kinetic.repositories.WorkoutPlanRepository;
import com.kinetic.repositories.WorkoutSessionRepository;
import com.kinetic.security.RateLimiter;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import lombok.extern.slf4j.Slf4j;

import java.text.Normalizer;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.Period;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class WorkoutService {

    /** Intervalo mínimo entre fichas geradas por IA para o próprio aluno (cota do app). */
    static final Duration STUDENT_AI_COOLDOWN = Duration.ofDays(30);

    /**
     * Tentativas de geração por aluno por hora. A cota de 30 dias só conta fichas salvas:
     * sem isto, uma resposta inválida da IA (ou duplo toque) permitia chamadas pagas sem fim.
     */
    static final int MAX_AI_ATTEMPTS_PER_HOUR = 5;
    private static final long ATTEMPT_WINDOW_MS = Duration.ofHours(1).toMillis();

    private static final Set<String> SECTIONS = Set.of("AQUECIMENTO", "PRINCIPAL", "FINALIZACAO");
    private static final String DEFAULT_SECTION = "PRINCIPAL";

    private final GeminiService geminiService;
    private final WorkoutPlanRepository workoutPlanRepository;
    private final UserRepository userRepository;
    private final PlanCycleSnapshotService planCycleSnapshotService;
    private final WorkoutSessionRepository workoutSessionRepository;
    private final TrainerClientRepository trainerClientRepository;
    private final TransactionTemplate transactionTemplate;
    private final RateLimiter rateLimiter;

    /**
     * Sem @Transactional: a chamada à IA leva até minutos e não pode segurar uma conexão
     * do pool. As checagens leem fora de transação; a gravação é atômica no fim.
     */
    public List<WorkoutPlanResponseDTO> generateWorkoutForUser(String userEmail, GenerateWorkoutRequestDto request) {
        validateRequest(request);

        int age = Period.between(request.birthDate(), AppTime.today()).getYears();
        if (age < 0) {
            throw new IllegalArgumentException("Data de nascimento nao pode ser no futuro.");
        }
        if (age < 10 || age > 120) {
            throw new IllegalArgumentException("Idade derivada (%d anos) esta fora do intervalo permitido (10-120).".formatted(age));
        }

        User user = userRepository.getByEmailOrThrow(userEmail);

        // Com vínculo ativo, protocolo e treino são do personal: depois do onboarding (ou se ele
        // já montou alguma ficha) o aluno não regenera nem muda objetivo/nível/frequência por aqui.
        // Bloqueia antes de gastar a chamada à IA. Com o vínculo encerrado o aluno volta a ter o controle.
        if (trainerClientRepository.existsByStudentIdAndStatus(user.getId(), TrainerLinkStatus.ATIVO)
                && (Boolean.TRUE.equals(user.getWorkoutOnboardingCompleted())
                    || workoutPlanRepository.existsByUserIdAndStatusAndCreatedByIsNotNull(user.getId(), "active"))) {
            throw new TrainerManagedPlanException(
                    "Seu treino é montado pelo seu personal. Fale com ele pelo WhatsApp para ajustar a ficha.");
        }

        // Cota de IA do aluno: a 1ª ficha (onboarding) é livre; depois, uma nova a cada
        // 30 dias. Acompanhamento contínuo é o serviço do personal — a IA grátis não compete com ele.
        workoutPlanRepository.findLatestAiCreatedAt(user.getId())
                .map(last -> last.plus(STUDENT_AI_COOLDOWN))
                .filter(next -> next.isAfter(LocalDateTime.now()))
                .ifPresent(next -> {
                    throw new AiQuotaExceededException(
                            "Você pode gerar uma nova ficha com IA a cada " + STUDENT_AI_COOLDOWN.toDays()
                                    + " dias. A próxima fica liberada em "
                                    + next.format(DateTimeFormatter.ofPattern("dd/MM")) + ".");
                });

        acquireAiAttempt(user.getId());

        // Só o id: e-mail e data de nascimento são dados pessoais e não vão para o log.
        log.info("Gerando ficha por IA para o usuário {} ({} anos)", user.getId(), age);

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

        return transactionTemplate.execute(status -> saveGeneratedPlans(userEmail, request, heightCm, generatedDtos));
    }

    private List<WorkoutPlanResponseDTO> saveGeneratedPlans(String userEmail, GenerateWorkoutRequestDto request,
                                                            double heightCm, List<GeneratedWorkoutPlanDto> generatedDtos) {
        // Recarrega dentro da transação: o perfil pode ter mudado durante a chamada à IA.
        User user = userRepository.getByEmailOrThrow(userEmail);

        // Captura estado pré-regeneração antes de sobrescrever o perfil
        String oldGoal = user.getGoal();
        double oldWeight = user.getWeight() != null ? user.getWeight() : 0.0;
        Optional<java.time.LocalDateTime> earliestActivePlan =
                workoutPlanRepository.findEarliestActiveCreatedAt(user.getId());

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
            workoutPlan.setEstimatedDurationMinutes(normalizeDuration(generatedDto.estimatedDurationMinutes()));
            workoutPlan.setUser(user);

            int sortOrder = 0;
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
                exercise.setLoadType(LoadType.resolve(exDto.loadType(), exDto.weight()));
                exercise.setRestTime(exDto.restTime());
                exercise.setSection(normalizeSection(exDto.section()));
                exercise.setSortOrder(sortOrder++);
                exercise.setWorkoutPlan(workoutPlan);
                workoutPlan.getExercises().add(exercise);
            }

            workoutPlansToSave.add(workoutPlan);
        }

        user.setBirthDate(request.birthDate());
        // Com personal ativo, peso e altura vêm das avaliações físicas dele.
        if (!trainerClientRepository.existsByStudentIdAndStatus(user.getId(), TrainerLinkStatus.ATIVO)) {
            user.setWeight(request.weight());
            user.setHeight(heightCm);
        }
        user.setGoal(request.goal());
        user.setFrequency(request.frequency());
        user.setLevel(request.level());
        boolean anamnesisChanged = request.medicalConditions() != null
                && !request.medicalConditions().equals(user.getMedicalConditions());
        if (request.medicalConditions() != null) {
            user.setMedicalConditions(request.medicalConditions());
        }
        StudentProtocolService.recordStudentEdit(user, anamnesisChanged);
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
        // Apos a geracao bem-sucedida do Gemini, na transacao da gravacao: se algo falhar, tudo reverte.
        workoutPlanRepository.archiveActivePlans(user.getId());

        List<WorkoutPlan> savedPlans = workoutPlanRepository.saveAll(workoutPlansToSave);

        return savedPlans.stream()
                .map(WorkoutPlanResponseDTO::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<WorkoutPlanResponseDTO> getMyPlans(String userEmail) {
        User user = userRepository.getByEmailOrThrow(userEmail);

        // Uma unica query agregada (sem N+1): ultima conclusao por plano do usuario.
        Map<UUID, LocalDateTime> lastCompletionByPlan = buildLastCompletionMap(user.getId());

        // Ordem de criação: o app atribui as letras A/B/C pela posição, então ela precisa ser estável.
        return workoutPlanRepository.findByUserIdAndStatusOrderByCreatedAtAsc(user.getId(), "active").stream()
                .map(plan -> WorkoutPlanResponseDTO.fromEntity(plan, lastCompletionByPlan.get(plan.getId())))
                .toList();
    }

    /**
     * Monta o mapa plano -> ultimo treino a partir da query agregada. Volta como
     * LocalDateTime no fuso do servidor, que o JacksonConfig serializa em UTC.
     */
    private Map<UUID, LocalDateTime> buildLastCompletionMap(UUID userId) {
        Map<UUID, LocalDateTime> map = new HashMap<>();
        for (Object[] row : workoutSessionRepository.findLatestSessionPerPlan(userId)) {
            map.put((UUID) row[0], LocalDateTime.ofInstant((Instant) row[1], ZoneId.systemDefault()));
        }
        return map;
    }

    private void acquireAiAttempt(UUID userId) {
        // Contador no Postgres: vale somado entre as cópias do backend e não zera no deploy.
        if (rateLimiter.acquire("ia-aluno:" + userId, MAX_AI_ATTEMPTS_PER_HOUR, ATTEMPT_WINDOW_MS) > 0) {
            throw new AiQuotaExceededException(
                    "Muitas tentativas de gerar a ficha. Aguarde uma hora e tente novamente.");
        }
    }

    /**
     * A IA as vezes devolve a secao com acento ou em minusculas ("Finalização");
     * o banco so aceita os tres valores canonicos (chk_exercises_section).
     */
    private static String normalizeSection(String raw) {
        if (raw == null || raw.isBlank()) return DEFAULT_SECTION;
        String section = Normalizer.normalize(raw.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toUpperCase(Locale.ROOT);
        return SECTIONS.contains(section) ? section : DEFAULT_SECTION;
    }

    /** Estimativa fora de 5–240 min e descartada: o DTO cai no fallback heuristico. */
    private static Integer normalizeDuration(Integer minutes) {
        return minutes != null && minutes >= 5 && minutes <= 240 ? minutes : null;
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
