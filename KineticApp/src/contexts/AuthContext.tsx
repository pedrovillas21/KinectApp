import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { setSignOutHandler } from '../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KineticUser {
  id: string | number;
  nome: string;
  email: string;
  level: string | null;
  birthDate: string | null;
  weight: number | null;
  height: number | null;
  goal: string | null;
  frequency: number | null;
}

export interface WorkoutPlanItem {
  id: string;
  title: string;
  subtitle?: string | null;
  tag?: string | null;
  level?: string | null;
  createdAt?: string | null;
  data: unknown[];
}

interface CompleteOnboardingData {
  workoutPlans?: WorkoutPlanItem[];
  level?: string;
  birthDate?: string;
  weight?: number;
  height?: number;
  goal?: string;
  frequency?: number;
}

type AuthResult =
  | { success: true }
  | { success: false; error: string };

interface AuthContextValue {
  isLoggedIn: boolean;
  hasOnboarded: boolean;
  currentUser: KineticUser | null;
  isLoadingAuth: boolean;
  workoutPlans: WorkoutPlanItem[];
  setWorkoutPlans: (plans: WorkoutPlanItem[]) => void;
  signIn: (args: { email: string; password: string }) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  register: (args: {
    name: string;
    email: string;
    password: string;
  }) => Promise<AuthResult>;
  completeOnboarding: (data: CompleteOnboardingData) => Promise<void>;
  verifyEmail: (email: string) => Promise<AuthResult>;
  resetPassword: (
    email: string,
    newPassword: string,
  ) => Promise<AuthResult>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

export const AuthContext = createContext<AuthContextValue>(
  {} as AuthContextValue,
);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<KineticUser | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlanItem[]>([]);

  const isOnboardedFromUser = (user: KineticUser | null): boolean => {
    if (!user) return false;
    return Boolean(user.goal) && Boolean(user.level);
  };

  useEffect(() => {
    const loadStoredSession = async () => {
      try {
        const token = await AsyncStorage.getItem('@kinetic_token');
        const userJson = await AsyncStorage.getItem('@kinetic_user');

        if (token && userJson) {
          const user = JSON.parse(userJson) as KineticUser;
          setCurrentUser(user);
          setIsLoggedIn(true);
          setHasOnboarded(isOnboardedFromUser(user));
        }
      } catch (e) {
        console.error('Erro ao carregar sessão:', e);
      } finally {
        setIsLoadingAuth(false);
      }
    };

    loadStoredSession();
  }, []);

  const register = async ({
    name,
    email,
    password,
  }: {
    name: string;
    email: string;
    password: string;
  }): Promise<AuthResult> => {
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
    } catch (e: unknown) {
      const err = e as { response?: { data?: unknown } };
      const message = err.response?.data || 'Erro ao cadastrar. Tente novamente.';
      return {
        success: false,
        error: typeof message === 'string' ? message : JSON.stringify(message),
      };
    }
  };

  const signIn = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<AuthResult> => {
    if (!email || !password) {
      return { success: false, error: 'Preencha e-mail e senha.' };
    }

    try {
      const response = await api.post<{
        token: string;
        id: string | number;
        nome: string;
        email: string;
        level: string | null;
        birthDate: string | null;
        weight: number | null;
        height: number | null;
        goal: string | null;
        frequency: number | null;
      }>('/auth/login', {
        email: email.trim(),
        senha: password,
      });

      const {
        token,
        id,
        nome,
        email: userEmail,
        level,
        birthDate,
        weight,
        height,
        goal,
        frequency,
      } = response.data;

      const userPayload: KineticUser = {
        id,
        nome,
        email: userEmail,
        level,
        birthDate,
        weight,
        height,
        goal,
        frequency,
      };

      await AsyncStorage.setItem('@kinetic_token', token);
      await AsyncStorage.setItem('@kinetic_user', JSON.stringify(userPayload));

      setCurrentUser(userPayload);
      setIsLoggedIn(true);
      setHasOnboarded(isOnboardedFromUser(userPayload));

      return { success: true };
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } | string } };
      const message =
        (err.response?.data as { message?: string })?.message ||
        err.response?.data ||
        'E-mail ou senha incorretos.';
      return {
        success: false,
        error: typeof message === 'string' ? message : 'E-mail ou senha incorretos.',
      };
    }
  };

  const signOut = useCallback(async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem('@kinetic_token');
      await AsyncStorage.removeItem('@kinetic_user');
    } catch (e) {
      console.error('Erro ao limpar sessão do storage:', e);
    } finally {
      setCurrentUser(null);
      setIsLoggedIn(false);
      setHasOnboarded(false);
      setWorkoutPlans([]);
    }
  }, []);

  useEffect(() => {
    setSignOutHandler(signOut);
    return () => setSignOutHandler(null);
  }, [signOut]);

  const completeOnboarding = async (
    data: CompleteOnboardingData,
  ): Promise<void> => {
    if (Array.isArray(data?.workoutPlans)) {
      setWorkoutPlans(data.workoutPlans);
    }

    const profileFields: (keyof CompleteOnboardingData)[] = [
      'level',
      'birthDate',
      'weight',
      'height',
      'goal',
      'frequency',
    ];

    const updatedUser: KineticUser = { ...currentUser } as KineticUser;
    for (const field of profileFields) {
      if (data?.[field] !== undefined) {
        (updatedUser as Record<string, unknown>)[field] = data[field];
      }
    }

    setCurrentUser(updatedUser);
    await AsyncStorage.setItem('@kinetic_user', JSON.stringify(updatedUser));
    setHasOnboarded(isOnboardedFromUser(updatedUser));
  };

  const verifyEmail = async (email: string): Promise<AuthResult> => {
    try {
      await api.post('/auth/verify-email', { email: email.trim() });
      return { success: true };
    } catch (e: unknown) {
      const err = e as { response?: { data?: unknown } };
      const message = err.response?.data || 'E-mail não encontrado.';
      return {
        success: false,
        error: typeof message === 'string' ? message : JSON.stringify(message),
      };
    }
  };

  const resetPassword = async (
    email: string,
    newPassword: string,
  ): Promise<AuthResult> => {
    try {
      await api.post('/auth/reset-password', {
        email: email.trim(),
        newPassword,
      });
      return { success: true };
    } catch (e: unknown) {
      const err = e as { response?: { data?: unknown } };
      const message = err.response?.data || 'Erro ao redefinir a senha.';
      return {
        success: false,
        error: typeof message === 'string' ? message : JSON.stringify(message),
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        hasOnboarded,
        currentUser,
        isLoadingAuth,
        workoutPlans,
        setWorkoutPlans,
        signIn,
        signOut,
        register,
        completeOnboarding,
        verifyEmail,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
