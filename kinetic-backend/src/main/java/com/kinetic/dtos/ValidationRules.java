package com.kinetic.dtos;

/** Regras de formato repetidas entre DTOs (constantes, para caber nas anotações de validação). */
public final class ValidationRules {

    private ValidationRules() {
    }

    /** Mesma regra no app e no painel: 8 a 20 caracteres, com maiúscula, minúscula e um especial. */
    public static final String PASSWORD_REGEX = "^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*_=+-]).{8,20}$";
    public static final String PASSWORD_MESSAGE = "A senha deve ter entre 8 e 20 caracteres, contendo pelo menos "
            + "uma letra maiúscula, uma minúscula e um caractere especial.";

    /** Apelido da rede e usuário de filial: minúsculas, números e hífen (sem hífen nas pontas), até 40. */
    public static final String HANDLE_REGEX = "^[a-z0-9]([a-z0-9-]{0,38}[a-z0-9])?$";

    /** Motivo das ações do ROOT, gravado na trilha de auditoria (mesmo limite no painel). */
    public static final int REASON_MIN = 10;
    public static final int REASON_MAX = 500;
    public static final String REASON_REQUIRED = "Informe o motivo.";
    public static final String REASON_SIZE = "O motivo precisa ter de 10 a 500 caracteres.";
}
