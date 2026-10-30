package com.kinetic.security;

import com.kinetic.enums.Role;
import com.kinetic.enums.UserStatus;
import com.kinetic.models.User;
import com.kinetic.repositories.UserRepository;
import com.kinetic.services.TermsService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final TermsService termsService;

    @Override
    public KineticUserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado."));

        // Compliance: só ATIVO é enabled; BLOQUEADO também é accountNonLocked=false.
        // Isso barra login (DaoAuthenticationProvider) e requests (filtro checa isEnabled).
        boolean enabled = user.getStatus() == UserStatus.ATIVO;
        boolean accountNonLocked = user.getStatus() != UserStatus.BLOQUEADO;

        // Celular é obrigatório para quem usa o atalho de WhatsApp (aluno e personal).
        boolean phoneRequired = (user.getRole() == Role.ALUNO || user.getRole() == Role.PERSONAL)
                && (user.getPhone() == null || user.getPhone().isBlank());

        return new KineticUserDetails(
                user.getEmail(),
                user.getSenha(),
                enabled,
                accountNonLocked,
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())),
                phoneRequired,
                !termsService.isAccepted(user),
                user.getCredentialsChangedAt()
        );
    }
}
