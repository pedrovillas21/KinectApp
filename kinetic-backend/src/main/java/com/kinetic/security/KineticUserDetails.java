package com.kinetic.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.User;

import java.time.Instant;
import java.util.Collection;

/**
 * UserDetails do Kinetic: além do que o Spring já carrega, diz se a conta ainda
 * precisa cadastrar o celular (ALUNO/PERSONAL criados antes de ele ser obrigatório).
 * O JwtAuthenticationFilter usa isso para barrar a API até o cadastro.
 */
public class KineticUserDetails extends User {

    private final boolean phoneRequired;
    private final boolean termsRequired;
    private final Instant credentialsChangedAt;

    public KineticUserDetails(String username, String password, boolean enabled, boolean accountNonLocked,
                              Collection<? extends GrantedAuthority> authorities, boolean phoneRequired,
                              boolean termsRequired, Instant credentialsChangedAt) {
        super(username, password, enabled, true, true, accountNonLocked, authorities);
        this.phoneRequired = phoneRequired;
        this.termsRequired = termsRequired;
        this.credentialsChangedAt = credentialsChangedAt;
    }

    /** Token emitido antes da última troca/redefinição de senha. */
    public boolean isIssuedBeforeCredentialsChange(Instant issuedAt) {
        return credentialsChangedAt != null && issuedAt != null && issuedAt.isBefore(credentialsChangedAt);
    }

    public boolean isPhoneRequired() {
        return phoneRequired;
    }

    /** Não aceitou a versão vigente dos Termos/Política: a API fica barrada até o aceite. */
    public boolean isTermsRequired() {
        return termsRequired;
    }
}
