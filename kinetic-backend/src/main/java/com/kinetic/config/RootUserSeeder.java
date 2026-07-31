package com.kinetic.config;

import com.kinetic.enums.Role;
import com.kinetic.models.User;
import com.kinetic.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Semeia o usuário ROOT no boot. Credenciais vêm exclusivamente de variáveis
 * de ambiente (ROOT_USER_EMAIL / ROOT_USER_PASSWORD) — nunca no código.
 * Sem as variáveis, o seed é silenciosamente ignorado (dev local sem ROOT).
 * Idempotente: se o e-mail já existe, apenas garante o papel ROOT.
 */
@Component
@RequiredArgsConstructor
public class RootUserSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(RootUserSeeder.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${root.user.email:}")
    private String rootEmail;

    @Value("${root.user.password:}")
    private String rootPassword;

    @Override
    public void run(String... args) {
        if (rootEmail.isBlank() || rootPassword.isBlank()) {
            log.info("RootUserSeeder: ROOT_USER_EMAIL/ROOT_USER_PASSWORD ausentes — seed ignorado.");
            return;
        }

        userRepository.findByEmail(rootEmail).ifPresentOrElse(existing -> {
            if (existing.getRole() != Role.ROOT) {
                existing.setRole(Role.ROOT);
                userRepository.save(existing);
                log.info("RootUserSeeder: usuário existente promovido a ROOT.");
            }
        }, () -> {
            User root = new User();
            root.setNome("Root");
            root.setEmail(rootEmail);
            root.setSenha(passwordEncoder.encode(rootPassword));
            root.setRole(Role.ROOT);
            userRepository.save(root);
            log.info("RootUserSeeder: usuário ROOT criado.");
        });
    }
}
