package com.kinetic.it;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.utility.MountableFile;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * V53 sobre dados que já existiam: a ficha e a hora de cada sessão saem das séries.
 * Banco próprio (sem Spring) para parar na V52, gravar o cenário e só então aplicar a V53.
 */
class SessionPlanBackfillIT {

    @Test
    void v53BackfillsSessionPlanFromSetsAndCleansSchema() {
        try (PostgreSQLContainer<?> pg = new PostgreSQLContainer<>("postgres:17-alpine")
                .withCopyFileToContainer(MountableFile.forClasspathResource("db/prod-schema-v49.sql"),
                        "/docker-entrypoint-initdb.d/schema.sql")) {
            pg.start();
            DriverManagerDataSource ds = new DriverManagerDataSource(pg.getJdbcUrl(), pg.getUsername(), pg.getPassword());
            JdbcTemplate jdbc = new JdbcTemplate(ds);

            migrate(ds, "52");

            UUID user = UUID.randomUUID();
            jdbc.update("INSERT INTO users (id, email, nome, senha) VALUES (?, ?, 'Aluno', 'x')",
                    user, user + "@teste.kinetic.invalid");
            UUID planA = plan(jdbc, user);
            UUID planB = plan(jdbc, user);
            UUID exA = exercise(jdbc, planA);
            UUID exB = exercise(jdbc, planB);

            // Duas fichas no mesmo dia, uma sessão que mistura fichas e uma sem série.
            UUID onlyA = session(jdbc, user);
            set(jdbc, onlyA, exA, "2026-10-20 13:05:00");
            set(jdbc, onlyA, exA, "2026-10-20 13:00:00");
            UUID onlyB = session(jdbc, user);
            set(jdbc, onlyB, exB, "2026-10-20 18:00:00");
            UUID mixed = session(jdbc, user);
            set(jdbc, mixed, exA, "2026-10-20 20:00:00");
            set(jdbc, mixed, exB, "2026-10-20 20:01:00");
            UUID noSets = session(jdbc, user);
            jdbc.update("INSERT INTO workout_execution_logs (id, completion_date, duration_minutes, user_id, workout_plan_id) "
                    + "VALUES (?, '2026-10-20 13:30:00', 30, ?, ?)", UUID.randomUUID(), user, planA);
            jdbc.update("GRANT SELECT ON access_logs, shedlock TO anon");

            migrate(ds, "53");

            assertAll(
                    () -> assertEquals(planA, planOf(jdbc, onlyA)),
                    () -> assertEquals(planB, planOf(jdbc, onlyB)),
                    () -> assertNull(planOf(jdbc, mixed)),
                    () -> assertNull(planOf(jdbc, noSets)),
                    // Hora da primeira série, gravada em UTC pelo servidor.
                    () -> assertTrue(createdAtIs(jdbc, onlyA, "2026-10-20 13:00:00+00")),
                    // Sem série: meia-noite do dia no Brasil.
                    () -> assertTrue(createdAtIs(jdbc, noSets, "2026-10-20 00:00:00-03")),
                    () -> assertEquals("NO", jdbc.queryForObject("SELECT is_nullable FROM information_schema.columns "
                            + "WHERE table_name = 'workout_sessions' AND column_name = 'created_at'", String.class)),
                    () -> assertNull(jdbc.queryForObject(
                            "SELECT to_regclass('public.workout_execution_logs')::text", String.class)),
                    () -> assertEquals(0, count(jdbc, "SELECT count(*) FROM pg_constraint "
                            + "WHERE conname = 'chk_invite_code_label_length'")),
                    () -> assertEquals(List.of(), indexes(jdbc, "'idx_users_last_active', "
                            + "'idx_ai_plan_generations_trainer_student', 'idx_companies_parent'")),
                    () -> assertEquals(6, indexes(jdbc, "'idx_workout_sessions_user_date', "
                            + "'idx_exercise_set_logs_session', 'idx_exercise_set_logs_exercise', "
                            + "'idx_exercises_workout_plan', 'idx_weight_history_user_date', "
                            + "'idx_workout_sessions_plan'").size()),
                    () -> assertFalse(jdbc.queryForObject(
                            "SELECT has_table_privilege('anon', 'access_logs', 'SELECT') "
                                    + "OR has_table_privilege('anon', 'shedlock', 'SELECT')", Boolean.class))
            );
        }
    }

    private static void migrate(DriverManagerDataSource ds, String target) {
        Flyway.configure().dataSource(ds).locations("classpath:db/migration")
                .baselineOnMigrate(true).baselineVersion("49").target(target)
                .load().migrate();
    }

    private static UUID plan(JdbcTemplate jdbc, UUID user) {
        UUID id = UUID.randomUUID();
        jdbc.update("INSERT INTO workout_plans (id, created_at, level, title, user_id) "
                + "VALUES (?, now(), 'Iniciante', 'Treino', ?)", id, user);
        return id;
    }

    private static UUID exercise(JdbcTemplate jdbc, UUID plan) {
        UUID id = UUID.randomUUID();
        jdbc.update("INSERT INTO exercises (id, name, workout_plan_id) VALUES (?, 'Supino', ?)", id, plan);
        return id;
    }

    private static UUID session(JdbcTemplate jdbc, UUID user) {
        UUID id = UUID.randomUUID();
        jdbc.update("INSERT INTO workout_sessions (id, duration_in_seconds, session_date, user_id) "
                + "VALUES (?, 1800, '2026-10-20', ?)", id, user);
        return id;
    }

    private static void set(JdbcTemplate jdbc, UUID session, UUID exercise, String loggedAt) {
        jdbc.update("INSERT INTO exercise_set_logs (id, logged_at, reps_performed, set_number, weight_used, "
                + "exercise_id, session_id) VALUES (?, ?::timestamp, 10, 1, 20, ?, ?)",
                UUID.randomUUID(), loggedAt, exercise, session);
    }

    private static UUID planOf(JdbcTemplate jdbc, UUID session) {
        return jdbc.queryForObject("SELECT workout_plan_id FROM workout_sessions WHERE id = ?", UUID.class, session);
    }

    private static boolean createdAtIs(JdbcTemplate jdbc, UUID session, String expected) {
        return Boolean.TRUE.equals(jdbc.queryForObject(
                "SELECT created_at = ?::timestamptz FROM workout_sessions WHERE id = ?", Boolean.class, expected, session));
    }

    private static int count(JdbcTemplate jdbc, String sql) {
        return jdbc.queryForObject(sql, Integer.class);
    }

    private static List<String> indexes(JdbcTemplate jdbc, String names) {
        return jdbc.queryForList("SELECT indexname FROM pg_indexes WHERE indexname IN (" + names + ")", String.class);
    }
}
