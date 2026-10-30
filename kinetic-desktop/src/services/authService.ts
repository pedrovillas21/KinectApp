import api from './api';

/**
 * Chamadas de conta que não mexem na sessão (confirmação de e-mail e recuperação
 * de senha). O backend responde igual exista a conta ou não.
 */

export type AccountResult = { success: true } | { success: false; error: string };

/** Erro de uma chamada de conta: o corpo em texto vira a mensagem; outro formato vai como JSON. */
export const accountError = (e: unknown, fallback: string): { success: false; error: string } => {
  const message = (e as { response?: { data?: unknown } }).response?.data || fallback;
  return { success: false, error: typeof message === 'string' ? message : JSON.stringify(message) };
};

export const confirmEmail = async (email: string, code: string): Promise<AccountResult> => {
  try {
    await api.post('/auth/confirm-email', { email: email.trim(), code });
    return { success: true };
  } catch (e: unknown) {
    return accountError(e, 'Não foi possível confirmar o e-mail.');
  }
};

/** Só falha por rede ou e-mail malformado. */
export const resendConfirmation = async (email: string): Promise<AccountResult> => {
  try {
    await api.post('/auth/resend-confirmation', { email: email.trim() });
    return { success: true };
  } catch (e: unknown) {
    return accountError(e, 'Não foi possível reenviar o código. Tente novamente.');
  }
};

/** Só falha por rede ou e-mail malformado. */
export const requestPasswordReset = async (email: string): Promise<AccountResult> => {
  try {
    await api.post('/auth/forgot-password', { email: email.trim() });
    return { success: true };
  } catch (e: unknown) {
    return accountError(e, 'Não foi possível enviar o código. Tente novamente.');
  }
};

export const resetPassword = async (email: string, code: string, newPassword: string): Promise<AccountResult> => {
  try {
    await api.post('/auth/reset-password', { email: email.trim(), code, newPassword });
    return { success: true };
  } catch (e: unknown) {
    return accountError(e, 'Não foi possível redefinir a senha.');
  }
};
