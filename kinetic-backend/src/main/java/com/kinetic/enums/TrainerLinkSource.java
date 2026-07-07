package com.kinetic.enums;

/**
 * Origem do vínculo personal↔aluno: INVITE nasce PENDENTE e depende do aceite
 * do aluno; COMPANY (empresa atribui) nasce ATIVO direto, sem convite.
 */
public enum TrainerLinkSource {
    INVITE,
    COMPANY
}
