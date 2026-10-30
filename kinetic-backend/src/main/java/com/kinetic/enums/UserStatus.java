package com.kinetic.enums;

/**
 * Estado de compliance da conta. ATIVO é o único que permite login; SUSPENSO
 * e BLOQUEADO são barrados na autenticação (via UserDetails.isEnabled) e no
 * filtro JWT (mata tokens já emitidos). Aplicado pelo ROOT.
 */
public enum UserStatus {
    ATIVO,
    SUSPENSO,
    BLOQUEADO
}
