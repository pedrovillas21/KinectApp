package com.kinetic.controllers;

import com.kinetic.dtos.GenerateWorkoutRequestDto;
import com.kinetic.dtos.GeneratedExerciseDto;
import com.kinetic.dtos.GeneratedWorkoutPlanDto;
import com.kinetic.models.Exercise;
import com.kinetic.models.User;
import com.kinetic.models.WorkoutPlan;
import com.kinetic.repositories.UserRepository;
import com.kinetic.repositories.WorkoutPlanRepository;
import com.kinetic.services.GeminiService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.Period;
import java.util.List;

@RestController
@RequestMapping("/api/workouts")
public class WorkoutController {

    private final GeminiService geminiService;
    private final WorkoutPlanRepository workoutPlanRepository;
    private final UserRepository userRepository;

    public WorkoutController(GeminiService geminiService,
                             WorkoutPlanRepository workoutPlanRepository,
                             UserRepository userRepository) {
        this.geminiService = geminiService;
        this.workoutPlanRepository = workoutPlanRepository;
        this.userRepository = userRepository;
    }

    @PostMapping("/generate")
    public ResponseEntity<?> generateWorkout(@RequestBody GenerateWorkoutRequestDto request) {
        // Obter usuário logado do SecurityContext
        String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        try {
            // Calcula a idade real a partir da data de nascimento
            int age = Period.between(request.birthDate(), LocalDate.now()).getYears();

            // Chama a IA para gerar as fichas com o perfil fisiológico completo
            List<GeneratedWorkoutPlanDto> generatedDtos = geminiService.generateWorkoutPlan(
                    request.level(),
                    age,
                    request.weight(),
                    request.height(),
                    request.goal(),
                    request.frequency()
            );

            List<WorkoutPlan> workoutPlansToSave = new java.util.ArrayList<>();

            for (GeneratedWorkoutPlanDto generatedDto : generatedDtos) {
                // Cria e preenche a entidade WorkoutPlan
                WorkoutPlan workoutPlan = new WorkoutPlan();
                workoutPlan.setTitle(generatedDto.title());
                workoutPlan.setSubtitle(generatedDto.subtitle());
                workoutPlan.setTag(generatedDto.tag());
                workoutPlan.setLevel(request.level());
                workoutPlan.setUser(user);

                // Cria e preenche as entidades Exercise
                if (generatedDto.data() != null) {
                    for (GeneratedExerciseDto exDto : generatedDto.data()) {
                        Exercise exercise = new Exercise();
                        exercise.setName(exDto.name());
                        exercise.setMuscles(exDto.muscles());
                        exercise.setType(exDto.type());
                        exercise.setSets(exDto.sets());
                        exercise.setReps(exDto.reps());
                        exercise.setWeight(exDto.weight());
                        exercise.setRestTime(exDto.restTime());
                        
                        // Associa a ficha ao exercício
                        exercise.setWorkoutPlan(workoutPlan);
                        
                        // Adiciona na lista da ficha
                        workoutPlan.getExercises().add(exercise);
                    }
                }
                workoutPlansToSave.add(workoutPlan);
            }

            // Salva todas as fichas no banco
            List<WorkoutPlan> savedPlans = workoutPlanRepository.saveAll(workoutPlansToSave);

            return ResponseEntity.status(HttpStatus.CREATED).body(savedPlans);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erro ao gerar treino: " + e.getMessage());
        }
    }

    @GetMapping("/my-plans")
    public ResponseEntity<List<WorkoutPlan>> getMyPlans() {
        String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<WorkoutPlan> plans = workoutPlanRepository.findByUserId(user.getId());
        return ResponseEntity.ok(plans);
    }
}

