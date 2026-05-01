import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Ao iniciar o app, verifica se há sessão salva no AsyncStorage
  useEffect(() => {
    const loadStoredSession = async () => {
      try {
        const token = await AsyncStorage.getItem('@kinetic_token');
        const userJson = await AsyncStorage.getItem('@kinetic_user');
        const onboarded = await AsyncStorage.getItem('@kinetic_onboarded');

        if (token && userJson) {
          const user = JSON.parse(userJson);
          setCurrentUser(user);
          setIsLoggedIn(true);
          setHasOnboarded(onboarded === 'true');
        }
      } catch (e) {
        console.error('Erro ao carregar sessão:', e);
      } finally {
        setIsLoadingAuth(false);
      }
    };

    loadStoredSession();
  }, []);

  const register = async ({ name, email, password }) => {
    if (!name || !email || !password) {
      return { success: false, error: 'Preencha todos os campos.' };
    }

    try {
      await api.post('/auth/register', {
        nome: name.trim(),
        email: email.trim(),
        senha: password,
      });
      return { success: true };
    } catch (e) {
      const message = e.response?.data || 'Erro ao cadastrar. Tente novamente.';
      return { success: false, error: typeof message === 'string' ? message : JSON.stringify(message) };
    }
  };

  const signIn = async ({ email, password }) => {
    if (!email || !password) {
      return { success: false, error: 'Preencha e-mail e senha.' };
    }

    try {
      const response = await api.post('/auth/login', {
        email: email.trim(),
        senha: password,
      });

      const { token, id, nome, email: userEmail } = response.data;

      // Persiste token e dados do usuário
      await AsyncStorage.setItem('@kinetic_token', token);
      await AsyncStorage.setItem('@kinetic_user', JSON.stringify({ id, nome, email: userEmail }));

      const onboarded = await AsyncStorage.getItem('@kinetic_onboarded');

      setCurrentUser({ id, nome, email: userEmail });
      setIsLoggedIn(true);
      setHasOnboarded(onboarded === 'true');

      return { success: true };
    } catch (e) {
      const message = e.response?.data?.message || e.response?.data || 'E-mail ou senha incorretos.';
      return { success: false, error: typeof message === 'string' ? message : 'E-mail ou senha incorretos.' };
    }
  };

  const signOut = async () => {
    await AsyncStorage.removeItem('@kinetic_token');
    await AsyncStorage.removeItem('@kinetic_user');
    // Não remove o @kinetic_onboarded para que no próximo login, o onboarding não reapareça
    setCurrentUser(null);
    setIsLoggedIn(false);
    setHasOnboarded(false);
  };

  const completeOnboarding = async (data) => {
    setHasOnboarded(true);
    await AsyncStorage.setItem('@kinetic_onboarded', 'true');
    // Salva o nível como dado adicional do usuário, se informado
    if (data?.level) {
      const updatedUser = { ...currentUser, level: data.level };
      setCurrentUser(updatedUser);
      await AsyncStorage.setItem('@kinetic_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{ isLoggedIn, hasOnboarded, currentUser, isLoadingAuth, signIn, signOut, register, completeOnboarding }}
    >
      {children}
    </AuthContext.Provider>
  );
};
