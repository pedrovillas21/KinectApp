package com.kinetic.security;

import com.kinetic.enums.UserStatus;
import com.kinetic.models.User;
import com.kinetic.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado com o e-mail: " + email));

        // Compliance: só ATIVO é enabled; BLOQUEADO também é accountNonLocked=false.
        // Isso barra login (DaoAuthenticationProvider) e requests (filtro checa isEnabled).
        boolean enabled = user.getStatus() == UserStatus.ATIVO;
        boolean accountNonLocked = user.getStatus() != UserStatus.BLOQUEADO;

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getSenha(),
                enabled,
                true,
                true,
                accountNonLocked,
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
        );
    }
}
