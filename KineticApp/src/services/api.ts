import axios, {
  AxiosInstance,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/api`;

export const ACCESS_TOKEN_KEY = '@kinetic_token';
export const REFRESH_TOKEN_KEY = '@kinetic_refresh_token';
const USER_KEY = '@kinetic_user';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Instância "crua" usada apenas para renovar o token. Não passa pelos
// interceptors do `api`, evitando recursão de refresh quando o /auth/refresh
// eventualmente também responder 401.
const refreshClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let _signOutHandler: (() => Promise<void>) | null = null;

export const setSignOutHandler = (
  handler: (() => Promise<void>) | null,
): void => {
  _signOutHandler = handler;
};

// Best-effort server-side logout — uses the raw client to avoid interceptor recursion.
export const logoutUser = async (refreshToken: string): Promise<void> => {
  try {
    await refreshClient.post('/auth/logout', { refreshToken });
  } catch {
    // intentionally ignored: network failure must not block local sign-out
  }
};

// Garante um único refresh em andamento mesmo com vários 401 simultâneos
// (ex.: dashboard + my-plans disparados em paralelo no startup).
let refreshPromise: Promise<string | null> | null = null;

export const refreshAccessToken = async (): Promise<string | null> => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) return null;

      const res = await refreshClient.post<{ token: string; refreshToken: string }>(
        '/auth/refresh',
        { refreshToken },
      );

      const newToken = res.data?.token;
      const newRefreshToken = res.data?.refreshToken;
      if (!newToken) return null;

      const pairs: [string, string][] = [[ACCESS_TOKEN_KEY, newToken]];
      if (newRefreshToken) pairs.push([REFRESH_TOKEN_KEY, newRefreshToken]);
      await AsyncStorage.multiSet(pairs);
      return newToken;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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

      // Tenta renovar o access token com o refresh token antes de desistir.
      const newToken = await refreshAccessToken();
      if (newToken) {
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }

      // Refresh indisponível/expirado: encerra a sessão.
      if (_signOutHandler) {
        await _signOutHandler();
      } else {
        await AsyncStorage.multiRemove([
          ACCESS_TOKEN_KEY,
          REFRESH_TOKEN_KEY,
          USER_KEY,
        ]);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
