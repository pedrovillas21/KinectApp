package com.kinetic.services;

import com.kinetic.models.User;
import com.kinetic.repositories.UserRepository;
import com.kinetic.utils.EmailTemplates;
import com.kinetic.utils.PasswordGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Instant;

/**
 * Senha das contas de gestão criadas por outra pessoa (dono pelo ROOT, filial pelo dono):
 * gerada pelo sistema e enviada por e-mail. Quem a recebe não a escolhe nem troca sozinho
 * no caso da filial; quem criou gera uma nova quando precisar.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AccessService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenService refreshTokenService;
    private final EmailService emailService;

    @Value("${app.panel-url:https://kineticfitness.com.br}")
    private String panelUrl;

    /** Define uma senha nova (sem salvar a conta); devolve o texto para o e-mail. */
    public String assignNewPassword(User user) {
        String password = PasswordGenerator.generate();
        user.setSenha(passwordEncoder.encode(password));
        user.setCredentialsChangedAt(Instant.now());
        return password;
    }

    /**
     * Gera outra senha, encerra as sessões abertas (refresh e access tokens) e envia o
     * acesso ao e-mail informado.
     */
    public void regenerate(User user, String sendTo, String login) {
        String password = assignNewPassword(user);
        userRepository.save(user);
        refreshTokenService.revokeAllForUser(user);
        sendAfterCommit(sendTo, user.getNome(), "Sua nova senha do Kinetic",
                "Uma nova senha foi gerada para o seu acesso ao painel do Kinetic. A anterior deixou de valer.",
                login, password);
    }

    /**
     * Envia o acesso só depois do commit: o e-mail é chamada HTTP externa e não pode sair
     * se a criação da conta falhar.
     */
    public void sendAfterCommit(String to, String nome, String title, String intro, String login, String password) {
        Runnable send = () -> {
            try {
                emailService.send(to, title,
                        EmailTemplates.credentialsEmail(nome, title, intro, login, password, panelUrl),
                        EmailTemplates.credentialsText(nome, intro, login, password, panelUrl));
            } catch (EmailService.EmailDeliveryException e) {
                log.error("Não foi possível enviar o acesso de {}: {}", login, e.getMessage());
            }
        };
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    send.run();
                }
            });
        } else {
            send.run();
        }
    }
}
