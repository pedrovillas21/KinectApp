/**
 * Armazenamento do access token no navegador (porta web do tokenStorage do
 * mobile, que usa expo-secure-store). O refresh token diverge de propósito:
 * no mobile ele mora no SecureStore; aqui, o backend grava um cookie
 * HttpOnly (kinetic_refresh_token, escopo /api/auth) que o JS nunca lê nem
 * escreve — só o access token (de vida curta) fica em localStorage.
 */

const ACCESS_KEY = 'kinetic_access_token';

export const getAccessToken = (): Promise<string | null> =>
  Promise.resolve(localStorage.getItem(ACCESS_KEY));

export const setAccessToken = (token: string): Promise<void> => {
  localStorage.setItem(ACCESS_KEY, token);
  return Promise.resolve();
};

export const clearTokens = async (): Promise<void> => {
  localStorage.removeItem(ACCESS_KEY);
};
