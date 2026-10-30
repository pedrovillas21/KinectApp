package com.kinetic.it;

import com.kinetic.services.EmailService;
import com.kinetic.services.GeminiService;
import com.kinetic.services.StorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.utility.MountableFile;

/**
 * Base dos testes de integração: backend inteiro contra um Postgres descartável com o
 * schema de produção (V49) e as migrations novas por cima. Nunca o banco do .env.
 * Um container e um contexto para a suíte toda; cada teste cria os próprios usuários.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestData.class)
public abstract class IntegrationTestBase {

    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine")
            .withCopyFileToContainer(MountableFile.forClasspathResource("db/prod-schema-v49.sql"),
                    "/docker-entrypoint-initdb.d/schema.sql");

    static {
        POSTGRES.start();
    }

    // Saem para a internet: nos testes não chamam nada.
    @MockitoBean
    protected GeminiService geminiService;
    @MockitoBean
    protected EmailService emailService;
    @MockitoBean
    protected StorageService storageService;

    @Autowired
    protected MockMvc mvc;
    @Autowired
    protected TestData data;
}
