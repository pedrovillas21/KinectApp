import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// A baseURL agora é o endereço do seu servidor Java (Spring Boot)
// DICA: Se estiver testando no celular físico com Expo, troque "localhost" pelo IP do seu Wi-Fi (ex: 192.168.1.15)
const API_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Callback de logout: será registrado pelo AuthContext para garantir que
// o estado React (isLoggedIn, currentUser) também seja resetado no 401.
let _signOutHandler = null;

export const setSignOutHandler = (handler) => {
  _signOutHandler = handler;
};

// Interceptor de requisição: adiciona o JWT Token automaticamente em todas as requisições
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('@kinetic_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de resposta: trata erros de autenticação (401) para forçar logout
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // Token expirado ou inválido — dispara o signOut real via AuthContext
      if (_signOutHandler) {
        await _signOutHandler();
      } else {
        // Fallback: limpa o storage diretamente se o handler não foi registrado
        await AsyncStorage.removeItem('@kinetic_token');
        await AsyncStorage.removeItem('@kinetic_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;