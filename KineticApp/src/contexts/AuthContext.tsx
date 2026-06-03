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
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
} from '../services/api';
import { isJwtExpired } from '../utils/jwt';

const USER_KEY = '@kinetic_user';

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

  // Fonte de verdade do servidor: verifica se o usuário já possui treino gerado.
  // Usado para confirmar o status de onboarding quando o perfil local está
  // incompleto (ex.: a geração concluiu no backend mas o cliente caiu por
  // timeout). Retorna a lista de planos ativos — vazia em caso de falha de rede,
  // para nunca bloquear o usuário indevidamente.
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
    const loadStoredSession = async () => {
      try {
        const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
        const userJson = await AsyncStorage.getItem(USER_KEY);

        // Access token expirado: tenta renová-lo com o refresh token antes de
        // descartar a sessão (assim o usuário não é deslogado a cada 24h e não
        // disparamos requests fadados ao 401 no startup).
        const hasValidAccess = Boolean(token) && !isJwtExpired(token as string);
        const validToken = hasValidAccess ? token : await refreshAccessToken();

        if (validToken && userJson) {
          const user = JSON.parse(userJson) as KineticUser;
          setCurrentUser(user);
          setIsLoggedIn(true);

          const localOnboarded = isOnboardedFromUser(user);
          setHasOnboarded(localOnboarded);

          // Se o perfil local não indica onboarding completo, confirma com o
          // backend: havendo treino, o usuário já passou do onboarding e vai
          // direto para a Home (evita repetir todo o fluxo num novo login).
          if (!localOnboarded) {
            const plans = await fetchExistingPlans();
            if (plans.length > 0) {
              setWorkoutPlans(plans);
              setHasOnboarded(true);
            }
          }
        } else if (token || userJson) {
          // Sessão ausente/expirada/corrompida e sem refresh válido: limpa o
          // storage para não montar telas autenticadas que dariam 401.
          await AsyncStorage.multiRemove([
            ACCESS_TOKEN_KEY,
            REFRESH_TOKEN_KEY,
            USER_KEY,
          ]);
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

      await AsyncStorage.multiSet([
        [ACCESS_TOKEN_KEY, token],
        [REFRESH_TOKEN_KEY, refreshToken],
        [USER_KEY, JSON.stringify(userPayload)],
      ]);

      setCurrentUser(userPayload);
      setIsLoggedIn(true);

      const localOnboarded = isOnboardedFromUser(userPayload);
      setHasOnboarded(localOnboarded);

      // Perfil incompleto no login não significa onboarding pendente: se o
      // backend já tem treino para o usuário, pula o onboarding e vai pra Home.
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

  const signOut = useCallback(async (): Promise<void> => {
    try {
      const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      if (refreshToken) {
        await logoutUser(refreshToken);
      }
      await AsyncStorage.multiRemove([
        ACCESS_TOKEN_KEY,
        REFRESH_TOKEN_KEY,
        USER_KEY,
      ]);
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
