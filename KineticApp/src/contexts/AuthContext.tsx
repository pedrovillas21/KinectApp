import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, {
  setSignOutHandler,
  refreshAccessToken,
  logoutUser,
} from '../services/api';
import {
  getRefreshToken,
  clearTokens,
  setTokens,
  migrateLegacyTokens,
} from '../services/tokenStorage';
import { isJwtExpired } from '../utils/jwt';

const USER_KEY = '@kinetic_user';
const REMEMBERED_USER_KEY = '@kinetic_remembered_user';

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

export interface RememberedUser {
  id: string | number;
  nome: string;
  email: string;
  streak?: number;
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
  rememberedUser: RememberedUser | null;
  isLoadingAuth: boolean;
  workoutPlans: WorkoutPlanItem[];
  setWorkoutPlans: (plans: WorkoutPlanItem[]) => void;
  signIn: (args: { email: string; password: string }) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  unlockSession: () => Promise<void>;
  forgetRememberedUser: () => Promise<void>;
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
  changePassword: (
    currentPassword: string,
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
  const [rememberedUser, setRememberedUser] = useState<RememberedUser | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlanItem[]>([]);

  const isOnboardedFromUser = (user: KineticUser | null): boolean => {
    if (!user) return false;
    return Boolean(user.goal) && Boolean(user.level);
  };

  const fetchExistingPlans = async (): Promise<WorkoutPlanItem[]> => {
    try {
      const res = await api.get<WorkoutPlanItem[]>('/workouts/my-plans');
      return Array.isArray(res.data) ? res.data : [];
    } catch (e) {
      console.warn('Falha ao verificar treinos existentes:', e);
      return [];
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        // Migration must complete before any routing decision.
        await migrateLegacyTokens();

        const rememberedJson = await AsyncStorage.getItem(REMEMBERED_USER_KEY);
        if (rememberedJson) {
          setRememberedUser(JSON.parse(rememberedJson) as RememberedUser);
        }
        // No silent login — user must explicitly unlock via biometrics or password.
      } catch (e) {
        console.error('Erro ao carregar sessão:', e);
      } finally {
        setIsLoadingAuth(false);
      }
    };

    bootstrap();
  }, []);

  // Called after successful biometric auth — exchanges the stored refresh token
  // for a fresh access token without asking the user for a password.
  const unlockSession = async (): Promise<void> => {
    try {
      const newToken = await refreshAccessToken();
      if (!newToken) {
        await forgetRememberedUser();
        return;
      }

      const userJson = await AsyncStorage.getItem(USER_KEY);
      if (!userJson) {
        await forgetRememberedUser();
        return;
      }

      const user = JSON.parse(userJson) as KineticUser;
      setCurrentUser(user);
      setIsLoggedIn(true);

      const localOnboarded = isOnboardedFromUser(user);
      setHasOnboarded(localOnboarded);

      if (!localOnboarded) {
        const plans = await fetchExistingPlans();
        if (plans.length > 0) {
          setWorkoutPlans(plans);
          setHasOnboarded(true);
        }
      }
    } catch (e) {
      console.error('Erro ao desbloquear sessão:', e);
      await forgetRememberedUser();
    }
  };

  // "Trocar conta" — wipes everything and shows the Welcome screen.
  const forgetRememberedUser = async (): Promise<void> => {
    try {
      await clearTokens();
      await AsyncStorage.multiRemove([USER_KEY, REMEMBERED_USER_KEY]);
    } catch (e) {
      console.error('Erro ao esquecer usuário:', e);
    } finally {
      setRememberedUser(null);
      setCurrentUser(null);
      setIsLoggedIn(false);
      setHasOnboarded(false);
      setWorkoutPlans([]);
    }
  };

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
        refreshToken: string;
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
        refreshToken,
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

      const remembered: RememberedUser = { id, nome, email: userEmail };

      await setTokens(token, refreshToken);
      await AsyncStorage.multiSet([
        [USER_KEY, JSON.stringify(userPayload)],
        [REMEMBERED_USER_KEY, JSON.stringify(remembered)],
      ]);

      setCurrentUser(userPayload);
      setRememberedUser(remembered);
      setIsLoggedIn(true);

      const localOnboarded = isOnboardedFromUser(userPayload);
      setHasOnboarded(localOnboarded);

      if (!localOnboarded) {
        const plans = await fetchExistingPlans();
        if (plans.length > 0) {
          setWorkoutPlans(plans);
          setHasOnboarded(true);
        }
      }

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

  // Explicit logout (Profile → "Sair") → always returns to Welcome, not the card.
  const signOut = useCallback(async (): Promise<void> => {
    try {
      const refreshToken = await getRefreshToken();
      if (refreshToken) {
        await logoutUser(refreshToken);
      }
      await clearTokens();
      await AsyncStorage.multiRemove([USER_KEY, REMEMBERED_USER_KEY]);
    } catch (e) {
      console.error('Erro ao limpar sessão do storage:', e);
    } finally {
      setCurrentUser(null);
      setRememberedUser(null);
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
    if (!currentUser) return;

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
        (updatedUser as unknown as Record<string, unknown>)[field] = data[field];
      }
    }

    setCurrentUser(updatedUser);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
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

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
  ): Promise<AuthResult> => {
    try {
      await api.post('/users/change-password', { currentPassword, newPassword });
      return { success: true };
    } catch (e: unknown) {
      const err = e as { response?: { data?: unknown } };
      const message = err.response?.data || 'Erro ao alterar a senha.';
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
        rememberedUser,
        isLoadingAuth,
        workoutPlans,
        setWorkoutPlans,
        signIn,
        signOut,
        unlockSession,
        forgetRememberedUser,
        register,
        completeOnboarding,
        verifyEmail,
        resetPassword,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
