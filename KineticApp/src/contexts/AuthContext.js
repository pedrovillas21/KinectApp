import React, { createContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { setSignOutHandler } from '../services/api';

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

        if (token && userJson) {
          const user = JSON.parse(userJson);
          // Chave de onboarding por usuário (evita vazamento entre contas)
          const onboarded = await AsyncStorage.getItem(`@kinetic_onboarded_${user.id}`);
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

      const { token, id, nome, email: userEmail, level } = response.data;

      // Persiste token e dados do usuário
      await AsyncStorage.setItem('@kinetic_token', token);
      await AsyncStorage.setItem('@kinetic_user', JSON.stringify({ id, nome, email: userEmail, level }));

      // Chave de onboarding por usuário
      const onboarded = await AsyncStorage.getItem(`@kinetic_onboarded_${id}`);

      setCurrentUser({ id, nome, email: userEmail, level });
      setIsLoggedIn(true);
      setHasOnboarded(onboarded === 'true');

      return { success: true };
    } catch (e) {
      const message = e.response?.data?.message || e.response?.data || 'E-mail ou senha incorretos.';
      return { success: false, error: typeof message === 'string' ? message : 'E-mail ou senha incorretos.' };
    }
  };

  const signOut = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('@kinetic_token');
      await AsyncStorage.removeItem('@kinetic_user');
      // Não remove a chave de onboarding per-user para que no próximo login não reapareça
    } catch (e) {
      console.error('Erro ao limpar sessão do storage:', e);
    } finally {
      // Sempre reseta o estado, mesmo se o storage falhar
      setCurrentUser(null);
      setIsLoggedIn(false);
      setHasOnboarded(false);
    }
  }, []);

  // Registra o signOut no interceptor do Axios para que 401s resetem o estado React
  useEffect(() => {
    setSignOutHandler(signOut);
    return () => setSignOutHandler(null);
  }, [signOut]);

  const completeOnboarding = async (data) => {
    // 1. Salva o nível como dado adicional do usuário, se informado
    if (data?.level) {
      const updatedUser = { ...currentUser, level: data.level };
      setCurrentUser(updatedUser);
      await AsyncStorage.setItem('@kinetic_user', JSON.stringify(updatedUser));
    }

    // 2. Persiste per-user para evitar vazamento entre contas
    const userId = currentUser?.id;
    if (userId) {
      await AsyncStorage.setItem(`@kinetic_onboarded_${userId}`, 'true');
      // 3. Libera a navegação
      setHasOnboarded(true);
    }
  };

  const verifyEmail = async (email) => {
    try {
      await api.post('/auth/verify-email', { email: email.trim() });
      return { success: true };
    } catch (e) {
      const message = e.response?.data || 'E-mail não encontrado.';
      return { success: false, error: typeof message === 'string' ? message : JSON.stringify(message) };
    }
  };

  const resetPassword = async (email, newPassword) => {
    try {
      await api.post('/auth/reset-password', {
        email: email.trim(),
        newPassword: newPassword,
      });
      return { success: true };
    } catch (e) {
      const message = e.response?.data || 'Erro ao redefinir a senha.';
      return { success: false, error: typeof message === 'string' ? message : JSON.stringify(message) };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn, hasOnboarded, currentUser, isLoadingAuth,
        signIn, signOut, register, completeOnboarding,
        verifyEmail, resetPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
