package com.kinetic.it;

import com.kinetic.enums.Role;
import com.kinetic.enums.TrainerLinkStatus;
import com.kinetic.models.Company;
import com.kinetic.models.Exercise;
import com.kinetic.models.TrainerClient;
import com.kinetic.models.User;
import com.kinetic.repositories.TrainerClientRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.function.Executable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.http.HttpHeaders.AUTHORIZATION;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Cada área só abre para o próprio papel, e ninguém alcança dado de outra conta pelo id. */
class AuthorizationIT extends IntegrationTestBase {

    @Autowired
    private TrainerClientRepository links;

    @Test
    void eachAreaOpensOnlyForItsRole() throws Exception {
        Company network = data.company(null);
        Company unit = data.company(network.getId());
        Map<Role, User> users = Map.of(
                Role.ROOT, data.user(Role.ROOT),
                Role.DONO, data.user(Role.DONO, network.getId()),
                Role.EMPRESA, data.user(Role.EMPRESA, unit.getId()),
                Role.PERSONAL, data.user(Role.PERSONAL),
                Role.ALUNO, data.user(Role.ALUNO));
        Map<Role, String> areas = Map.of(
                Role.ROOT, "/api/root/metrics",
                Role.DONO, "/api/dono/rede",
                Role.EMPRESA, "/api/empresa/analytics",
                Role.PERSONAL, "/api/trainer/students",
                Role.ALUNO, "/api/me/invites");

        List<Executable> checks = new ArrayList<>();
        areas.forEach((owner, path) -> {
            checks.add(() -> assertEquals(403, mvc.perform(get(path)).andReturn().getResponse().getStatus(),
                    "anônimo em " + path));
            users.forEach((role, user) -> checks.add(() -> assertEquals(role == owner ? 200 : 403,
                    mvc.perform(get(path).header(AUTHORIZATION, data.bearer(user))).andReturn().getResponse().getStatus(),
                    role + " em " + path)));
        });
        assertAll(checks);
    }

    @Test
    void trainerCannotReadAnotherTrainersStudent() throws Exception {
        User trainerA = data.user(Role.PERSONAL);
        User trainerB = data.user(Role.PERSONAL);
        User student = data.user(Role.ALUNO);
        data.link(trainerA, student, null);
        data.assessment(trainerA, student);

        mvc.perform(get("/api/trainer/students/{id}/assessments", student.getId())
                        .header(AUTHORIZATION, data.bearer(trainerB)))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/trainer/students/{id}/assessments", student.getId())
                        .header(AUTHORIZATION, data.bearer(trainerA)))
                .andExpect(status().isOk());
    }

    @Test
    void studentCannotLogSetsOnAnotherStudentsPlan() throws Exception {
        Exercise othersExercise = data.exerciseOf(data.user(Role.ALUNO));
        User student = data.user(Role.ALUNO);
        String body = """
                {"durationInSeconds": 1800, "date": "%s",
                 "exercisesLog": [{"exerciseId": "%s", "setNumber": 1, "repsPerformed": 10, "weightUsed": 20}]}
                """.formatted(LocalDate.now(), othersExercise.getId());

        mvc.perform(post("/api/sessions/log").header(AUTHORIZATION, data.bearer(student))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isNotFound());
    }

    @Test
    void ownerCannotOpenAnotherNetworksUnit() throws Exception {
        Company myNetwork = data.company(null);
        Company otherUnit = data.company(data.company(null).getId());
        User dono = data.user(Role.DONO, myNetwork.getId());

        mvc.perform(get("/api/dono/unidades/{id}/analytics", otherUnit.getId())
                        .header(AUTHORIZATION, data.bearer(dono)))
                .andExpect(status().isNotFound());
    }

    @Test
    void unitCannotEndAnotherCompanysLink() throws Exception {
        Company unitA = data.company(data.company(null).getId());
        Company unitB = data.company(data.company(null).getId());
        User empresaA = data.user(Role.EMPRESA, unitA.getId());
        TrainerClient linkOfB = data.link(data.user(Role.PERSONAL, unitB.getId()), data.user(Role.ALUNO), unitB.getId());

        mvc.perform(delete("/api/empresa/alunos/{id}", linkOfB.getId())
                        .header(AUTHORIZATION, data.bearer(empresaA)))
                .andExpect(status().isNotFound());
        assertEquals(TrainerLinkStatus.ATIVO, links.findById(linkOfB.getId()).orElseThrow().getStatus());
    }
}
