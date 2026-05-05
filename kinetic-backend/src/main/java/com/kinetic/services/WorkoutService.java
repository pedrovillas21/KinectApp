package com.kinetic.services;

import com.kinetic.dtos.GenerateWorkoutRequestDto;
import com.kinetic.dtos.GeneratedExerciseDto;
import com.kinetic.dtos.GeneratedWorkoutPlanDto;
import com.kinetic.dtos.WorkoutPlanResponseDTO;
import com.kinetic.models.Exercise;
import com.kinetic.models.User;
import com.kinetic.models.WorkoutPlan;
import com.kinetic.repositories.UserRepository;
import com.kinetic.repositories.WorkoutPlanRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Period;
import java.util.ArrayList;
import java.util.List;

@Service
public class WorkoutService {

    private final GeminiService geminiService;
    private final WorkoutPlanRepository workoutPlanRepository;
    private final UserRepository userRepository;

    public WorkoutService(GeminiService geminiService,
                          WorkoutPlanRepository workoutPlanRepository,
                          UserRepository userRepository) {
        this.geminiService = geminiService;
        this.workoutPlanRepository = workoutPlanRepository;
        this.userRepository = userRepository;
    }

    public List<WorkoutPlanResponseDTO> generateWorkoutForUser(String userEmail, GenerateWorkoutRequestDto request) {
        validateRequest(request);

        int age = Period.between(request.birthDate(), LocalDate.now()).getYears();
        if (age < 0) {
            throw new IllegalArgumentException("Data de nascimento nao pode ser no futuro.");
        }
        if (age < 10 || age > 120) {
            throw new IllegalArgumentException("Idade derivada (%d anos) esta fora do intervalo permitido (10-120).".formatted(age));
        }

        User user = findUserByEmail(userEmail);
        double heightCm = request.height() < 3 ? request.height() * 100 : request.height();

        List<GeneratedWorkoutPlanDto> generatedDtos = geminiService.generateWorkoutPlan(
                request.level(),
                age,
                request.weight(),
                heightCm,
                request.goal(),
                request.frequency()
        );

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

        List<WorkoutPlan> savedPlans = workoutPlanRepository.saveAll(workoutPlansToSave);

        user.setLevel(request.level());
        userRepository.save(user);

        return savedPlans.stream()
                .map(WorkoutPlanResponseDTO::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<WorkoutPlanResponseDTO> getMyPlans(String userEmail) {
        User user = findUserByEmail(userEmail);

        return workoutPlanRepository.findByUserId(user.getId()).stream()
                .map(WorkoutPlanResponseDTO::fromEntity)
                .toList();
    }

    private User findUserByEmail(String userEmail) {
        return userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new EntityNotFoundException("Usuario nao encontrado."));
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
