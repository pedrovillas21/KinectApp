package com.kinetic.enums;

/**
 * Papéis do sistema. Todo usuário existente é ALUNO (default do banco);
 * PERSONAL nasce por auto-cadastro ou criado por uma EMPRESA; EMPRESA é
 * criada pelo ROOT; ROOT é semeado no boot.
 */
public enum Role {
    ALUNO,
    PERSONAL,
    EMPRESA,
    ROOT
}
