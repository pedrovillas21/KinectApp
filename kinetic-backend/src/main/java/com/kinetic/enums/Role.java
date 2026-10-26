package com.kinetic.enums;

/**
 * Papéis do sistema. Todo usuário existente é ALUNO (default do banco);
 * PERSONAL nasce por auto-cadastro ou criado por uma EMPRESA; EMPRESA é
 * criada pelo ROOT; ROOT é semeado no boot.
 */
public enum Role {
    ALUNO,
    PERSONAL,
    /** Conta de uma filial (unidade); entra por usuário (rede.filial), criada pelo DONO. */
    EMPRESA,
    /** Dono de uma rede de empresas: cadastra as filiais e acompanha todas. Criado pelo ROOT. */
    DONO,
    ROOT
}
