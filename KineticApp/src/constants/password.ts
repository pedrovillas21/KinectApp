/** Mesma regra do backend e do painel: 8 a 20 caracteres, com maiúscula, minúscula e um caractere especial. */
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*_=+-]).{8,20}$/;

export const PASSWORD_RULE_MESSAGE =
  'A senha precisa de 8 a 20 caracteres, com maiúscula, minúscula e um caractere especial.';

/** Cada critério da regra, para a checklist das telas de senha. */
export function passwordChecks(password: string) {
  return {
    length: password.length >= 8 && password.length <= 20,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    symbol: /[!@#$%^&*_=+-]/.test(password),
  };
}
