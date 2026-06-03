import axios, {
  AxiosInstance,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import {
  getAccessToken,
  setAccessToken,
  setRefreshToken,
  getRefreshToken,
  clearTokens,
} from './tokenStorage';

const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/api`;

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Raw client for refresh/logout — bypasses interceptors to avoid recursion.
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

// Best-effort server-side logout.
export const logoutUser = async (refreshToken: string): Promise<void> => {
  try {
    await refreshClient.post('/auth/logout', { refreshToken });
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
      const storedRefresh = await getRefreshToken();
      if (!storedRefresh) return null;

      const res = await refreshClient.post<{ token: string; refreshToken: string }>(
        '/auth/refresh',
        { refreshToken: storedRefresh },
      );

      const newToken = res.data?.token;
      const newRefreshToken = res.data?.refreshToken;
      if (!newToken) return null;

      await setAccessToken(newToken);
      if (newRefreshToken) await setRefreshToken(newRefreshToken);

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
    const token = await getAccessToken();
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
