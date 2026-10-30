package com.kinetic.exceptions;

import lombok.Getter;

/**
 * A senha conferiu, mas a conta (DONO, EMPRESA ou ROOT) precisa do código do app
 * autenticador. {@code setupRequired}: o app ainda não foi cadastrado.
 */
@Getter
public class SecondFactorRequiredException extends RuntimeException {

    private final boolean setupRequired;
    private final String challengeToken;

    public SecondFactorRequiredException(boolean setupRequired, String challengeToken) {
        super(setupRequired
                ? "Cadastre o app autenticador para concluir o acesso."
                : "Digite o código do app autenticador.");
        this.setupRequired = setupRequired;
        this.challengeToken = challengeToken;
    }
}
