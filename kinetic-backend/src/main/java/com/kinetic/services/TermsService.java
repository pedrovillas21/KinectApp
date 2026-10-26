package com.kinetic.services;

import com.kinetic.enums.Role;
import com.kinetic.models.User;
import com.kinetic.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Aceite dos Termos de Uso e da Política de Privacidade. Guarda qual versão foi aceita
 * e quando (LGPD art. 8 §2: provar o consentimento é obrigação de quem trata os dados).
 * Conta criada por terceiros (empresa cadastra o personal, ROOT cadastra a empresa) ou
 * que aceitou uma versão antiga aceita no próximo acesso: os clientes barram o uso
 * enquanto {@link #isAccepted} for falso.
 */
@Service
public class TermsService {

    private final UserRepository userRepository;
    private final String currentVersion;

    public TermsService(UserRepository userRepository, @Value("${legal.terms-version}") String currentVersion) {
        this.userRepository = userRepository;
        this.currentVersion = currentVersion;
    }

    public String currentVersion() {
        return currentVersion;
    }

    /** ROOT é a própria operação do Kinetic, não um titular usando o serviço: nunca é barrado. */
    public boolean isAccepted(User user) {
        return user.getRole() == Role.ROOT || currentVersion.equals(user.getTermsVersion());
    }

    /** Marca a versão vigente como aceita agora (sem salvar: quem chama persiste). */
    public void markAccepted(User user) {
        user.setTermsVersion(currentVersion);
        user.setTermsAcceptedAt(Instant.now());
    }

    @Transactional
    public void accept(String email) {
        User user = userRepository.getByEmailOrThrow(email);
        markAccepted(user);
        userRepository.save(user);
    }
}
