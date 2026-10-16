package com.kinetic.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.User;

import java.util.Collection;

/**
 * UserDetails do Kinetic: além do que o Spring já carrega, diz se a conta ainda
 * precisa cadastrar o celular (ALUNO/PERSONAL criados antes de ele ser obrigatório).
 * O JwtAuthenticationFilter usa isso para barrar a API até o cadastro.
 */
public class KineticUserDetails extends User {

    private final boolean phoneRequired;

    public KineticUserDetails(String username, String password, boolean enabled, boolean accountNonLocked,
                              Collection<? extends GrantedAuthority> authorities, boolean phoneRequired) {
        super(username, password, enabled, true, true, accountNonLocked, authorities);
        this.phoneRequired = phoneRequired;
    }

    public boolean isPhoneRequired() {
        return phoneRequired;
    }
}
