import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';
import { getAccessToken, setAccessToken, clearTokens } from './tokenStorage';

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
  // O refresh token vive num cookie HttpOnly (kinetic_refresh_token) —
  // withCredentials garante que o browser o envie/receba em /auth/*.
  withCredentials: true,
});

// Raw client for refresh/logout — bypasses interceptors to avoid recursion.
const refreshClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

let _signOutHandler: (() => Promise<void>) | null = null;

export const setSignOutHandler = (
  handler: (() => Promise<void>) | null,
): void => {
  _signOutHandler = handler;
};

// Best-effort server-side logout. O refresh token vai no cookie HttpOnly
// (withCredentials); o backend o lê de lá e limpa o cookie na resposta.
export const logoutUser = async (): Promise<void> => {
  try {
    await refreshClient.post('/auth/logout');
  } catch {
    // intentionally ignored: network failure must not block local sign-out
  }
};

// Coalesces concurrent 401s into a single refresh request.
let refreshPromise: Promise<string | null> | null = null;

export const refreshAccessToken = async (): Promise<string | null> => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      // Sem corpo: o refresh token vai no cookie HttpOnly (withCredentials).
      const res = await refreshClient.post<{ token: string; refreshToken: string }>(
        '/auth/refresh',
      );

      const newToken = res.data?.token;
      if (!newToken) return null;

      await setAccessToken(newToken);
      // O backend já regravou o cookie com o refresh token rotacionado.
      return newToken;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

const PUBLIC_ROUTES = [
  '/auth/register',
  '/auth/login',
  '/auth/refresh',
  '/auth/logout',
  '/auth/verify-email',
  '/auth/reset-password',
];

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const isPublic = PUBLIC_ROUTES.some(route => config.url?.startsWith(route));
    if (!isPublic) {
      const token = await getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;

      const newToken = await refreshAccessToken();
      if (newToken) {
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }

      if (_signOutHandler) {
        await _signOutHandler();
      } else {
        await clearTokens();
      }
    }

    return Promise.reject(error);
  },
);

export default api;
