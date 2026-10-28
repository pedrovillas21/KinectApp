package com.kinetic.it;

import com.kinetic.enums.Role;
import com.kinetic.models.Exercise;
import com.kinetic.models.User;
import com.kinetic.models.WorkoutPlan;
import com.kinetic.repositories.WorkoutPlanRepository;
import com.kinetic.utils.AppTime;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.http.HttpHeaders.AUTHORIZATION;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** V53: a ficha do treino sai dos exercícios registrados, sem depender do workoutPlanId do app. */
class WorkoutSessionPlanIT extends IntegrationTestBase {

    @Autowired
    private WorkoutPlanRepository plans;
    @Autowired
    private JdbcTemplate jdbc;

    @Test
    void sessionTakesPlanFromItsExercisesAndAdvancesHomeRotation() throws Exception {
        User student = data.user(Role.ALUNO);
        Exercise a = data.exerciseOf(student);
        Exercise b = data.exerciseOf(student);
        // Mesma ordem do rodízio da Home.
        List<UUID> rotation = plans.findByUserIdAndStatusOrderByCreatedAtAsc(student.getId(), "active").stream()
                .map(WorkoutPlan::getId).toList();
        Exercise exercise = a.getWorkoutPlan().getId().equals(rotation.get(0)) ? a : b;

        String body = """
                {"durationInSeconds": 1800, "date": "%s",
                 "exercisesLog": [{"exerciseId": "%s", "setNumber": 1, "repsPerformed": 10, "weightUsed": 20}]}
                """.formatted(AppTime.today(), exercise.getId());
        mvc.perform(post("/api/sessions/log").header(AUTHORIZATION, data.bearer(student))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated());

        assertEquals(rotation.get(0), jdbc.queryForObject(
                "SELECT workout_plan_id FROM workout_sessions WHERE user_id = ?", UUID.class, student.getId()));
        mvc.perform(get("/api/home/dashboard").header(AUTHORIZATION, data.bearer(student)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nextWorkout.workoutPlanId").value(rotation.get(1).toString()));
        mvc.perform(get("/api/users/profile").header(AUTHORIZATION, data.bearer(student)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalWorkoutsDone").value(1));
    }
}
