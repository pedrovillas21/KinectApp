/**
 * Armazenamento de tokens no navegador (porta web do tokenStorage do mobile,
 * que usa expo-secure-store). Mesma interface pública — os retornos continuam
 * Promises para que api.ts/chatService.ts sejam copiados sem alteração.
 */

const ACCESS_KEY = 'kinetic_access_token';
const REFRESH_KEY = 'kinetic_refresh_token';

export const getAccessToken = (): Promise<string | null> =>
  Promise.resolve(localStorage.getItem(ACCESS_KEY));

export const setAccessToken = (token: string): Promise<void> => {
  localStorage.setItem(ACCESS_KEY, token);
  return Promise.resolve();
};

export const getRefreshToken = (): Promise<string | null> =>
  Promise.resolve(localStorage.getItem(REFRESH_KEY));

export const setRefreshToken = (token: string): Promise<void> => {
  localStorage.setItem(REFRESH_KEY, token);
  return Promise.resolve();
};

export const setTokens = async (access: string, refresh: string): Promise<void> => {
  await Promise.all([setAccessToken(access), setRefreshToken(refresh)]);
};

export const clearTokens = async (): Promise<void> => {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
};
