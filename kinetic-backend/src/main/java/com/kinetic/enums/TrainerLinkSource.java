package com.kinetic.enums;

/**
 * Origem do vínculo personal↔aluno: INVITE nasce PENDENTE e depende do aceite
 * do aluno; COMPANY (empresa atribui) nasce ATIVO direto, sem convite;
 * INVITE_CODE nasce ATIVO quando o aluno resgata o código do link de convite
 * (digitar o código já é o aceite).
 */
public enum TrainerLinkSource {
    INVITE,
    COMPANY,
    INVITE_CODE
}
