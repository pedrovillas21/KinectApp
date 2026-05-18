import axios, {
  AxiosInstance,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/api`;

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
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

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await AsyncStorage.getItem('@kinetic_token');
    console.log(
      '[api] request:',
      config.url,
      '| token:',
      token ? `${token.substring(0, 20)}...` : 'AUSENTE',
    );
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
    if (error.response && error.response.status === 401) {
      if (_signOutHandler) {
        await _signOutHandler();
      } else {
        await AsyncStorage.removeItem('@kinetic_token');
        await AsyncStorage.removeItem('@kinetic_user');
      }
    }
    return Promise.reject(error);
  },
);

export default api;
