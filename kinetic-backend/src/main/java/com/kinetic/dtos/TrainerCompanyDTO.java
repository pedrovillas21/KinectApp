package com.kinetic.dtos;

import java.util.UUID;

/**
 * Situação do personal com empresas: a empresa da qual é funcionário e o convite
 * que aguarda o aceite dele. Qualquer um dos dois pode ser nulo.
 */
public record TrainerCompanyDTO(CompanyRef current, CompanyRef pending) {
    public record CompanyRef(UUID id, String nome) {}
}
