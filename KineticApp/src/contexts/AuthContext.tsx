import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearResourceCache } from '../services/resourceCache';
import api, {
  setSignOutHandler,
  setTermsRequiredHandler,
  refreshAccessToken,
  logoutUser,
} from '../services/api';
import {
  getRefreshToken,
  clearTokens,
  setTokens,
  migrateLegacyTokens,
} from '../services/tokenStorage';

const USER_KEY = '@kinetic_user';
const REMEMBERED_USER_KEY = '@kinetic_remembered_user';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KineticUser {
  id: string | number;
  nome: string;
  email: string;
  // Celular (DDD + número). null em contas criadas antes de ele ser obrigatório:
  // o roteamento barra o app até o cadastro (PhoneRequiredScreen).
  phone: string | null;
  // Aceitou a versão vigente dos Termos/Política? false: o roteamento barra o app até o
  // aceite (TermsRequiredScreen). Ausente em cache antigo: conferido no backend ao destravar.
  termsAccepted?: boolean;
  // "Já possuo treino" no onboarding: libera o app sem objetivo/nível (só neste aparelho).
  onboardingSkipped?: boolean;
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
}

interface CompleteOnboardingData {
  level?: string;
  birthDate?: string;
  weight?: number;
  height?: number;
  goal?: string;
  frequency?: number;
}

type AuthResult =
  | { success: true }
  | { success: false; error: string; needsEmailVerification?: boolean };

interface AuthContextValue {
  isLoggedIn: boolean;
  hasOnboarded: boolean;
  currentUser: KineticUser | null;
  rememberedUser: RememberedUser | null;
  isLoadingAuth: boolean;
  // True logo após um logout explícito — leva o roteamento direto ao Login (em vez do
  // card de usuário persistente ou da tela de boas-vindas). Resetado ao logar de novo.
  justLoggedOut: boolean;
  signIn: (args: { email: string; password: string }) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  unlockSession: () => Promise<void>;
  forgetRememberedUser: () => Promise<void>;
  register: (args: {
    name: string;
    email: string;
    password: string;
    phone: string;
  }) => Promise<AuthResult>;
  completeOnboarding: (data: CompleteOnboardingData) => Promise<void>;
  skipOnboarding: () => Promise<void>;
  confirmEmail: (email: string, code: string) => Promise<AuthResult>;
  resendConfirmation: (email: string) => Promise<AuthResult>;
  requestPasswordReset: (email: string) => Promise<AuthResult>;
  resetPassword: (
    email: string,
    code: string,
    newPassword: string,
  ) => Promise<AuthResult>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<AuthResult>;
  updatePhone: (phone: string) => Promise<AuthResult>;
  acceptTerms: () => Promise<AuthResult>;
}

/** Texto de erro devolvido pela API (o backend responde a mensagem no corpo) ou o fallback. */
function apiErrorMessage(e: unknown, fallback: string): string {
  const message = (e as { response?: { data?: unknown } }).response?.data || fallback;
  return typeof message === 'string' ? message : JSON.stringify(message);
}

// ─── Context ──────────────────────────────────────────────────────────────────

export const AuthContext = createContext<AuthContextValue>(
  {} as AuthContextValue,
);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<KineticUser | null>(null);
  const [rememberedUser, setRememberedUser] = useState<RememberedUser | null>(null);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [justLoggedOut, setJustLoggedOut] = useState(false);
  const isLoggedIn = currentUser !== null;

  const isOnboardedFromUser = (user: KineticUser | null): boolean => {
    if (!user) return false;
    return Boolean(user.onboardingSkipped) || (Boolean(user.goal) && Boolean(user.level));
  };

  // Sem objetivo/nível salvos, mas com ficha (ex.: montada pelo personal): o onboarding já não se aplica.
  const markOnboardedIfHasPlans = async (): Promise<void> => {
    try {
      const res = await api.get<unknown[]>('/workouts/my-plans');
      if (Array.isArray(res.data) && res.data.length > 0) setHasOnboarded(true);
    } catch (e) {
      console.warn('Falha ao verificar treinos existentes:', e);
    }
  };

  const fetchProfileFlags = async (): Promise<{ phone: string | null; termsAccepted: boolean }> => {
    try {
      const res = await api.get<{ phone: string | null; termsAccepted?: boolean }>('/users/profile');
      return { phone: res.data.phone ?? null, termsAccepted: res.data.termsAccepted !== false };
    } catch (e) {
      console.warn('Falha ao verificar o cadastro:', e);
      // Sem rede não barra: se faltar o aceite, a API responde TERMS_REQUIRED e o app pede.
      return { phone: null, termsAccepted: true };
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
      // Celular e aceite dos termos podem ter mudado desde o cache (outro aparelho, termos novos).
      const flags = await fetchProfileFlags();
      user.phone = user.phone || flags.phone;
      user.termsAccepted = flags.termsAccepted;
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
      setCurrentUser(user);
      setJustLoggedOut(false);

      const localOnboarded = isOnboardedFromUser(user);
      setHasOnboarded(localOnboarded);
      if (!localOnboarded) await markOnboardedIfHasPlans();
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
      // Dados das telas ficam no aparelho por usuário; ao sair, saem todos.
      await clearResourceCache();
    } catch (e) {
      console.error('Erro ao esquecer usuário:', e);
    } finally {
      setRememberedUser(null);
      setCurrentUser(null);
      setHasOnboarded(false);
    }
  };

  const register = async ({
    name,
    email,
    password,
    phone,
  }: {
    name: string;
    email: string;
    password: string;
    phone: string;
  }): Promise<AuthResult> => {
    if (!name || !email || !password || !phone) {
      return { success: false, error: 'Preencha todos os campos.' };
    }

    try {
      await api.post('/auth/register', {
        nome: name.trim(),
        email: email.trim(),
        senha: password,
        phone: phone.replace(/\D/g, ''),
        // A tela só chama depois da caixa de aceite marcada.
        termsAccepted: true,
      });
      return { success: true };
    } catch (e: unknown) {
      return { success: false, error: apiErrorMessage(e, 'Erro ao cadastrar. Tente novamente.') };
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
        phone: string | null;
        level: string | null;
        birthDate: string | null;
        weight: number | null;
        height: number | null;
        goal: string | null;
        frequency: number | null;
        termsAccepted?: boolean;
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
        phone,
        level,
        birthDate,
        weight,
        height,
        goal,
        frequency,
        termsAccepted,
      } = response.data;

      const userPayload: KineticUser = {
        id,
        nome,
        email: userEmail,
        phone: phone ?? null,
        termsAccepted: termsAccepted !== false,
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
      setJustLoggedOut(false);

      const localOnboarded = isOnboardedFromUser(userPayload);
      setHasOnboarded(localOnboarded);
      if (!localOnboarded) await markOnboardedIfHasPlans();

      return { success: true };
    } catch (e: unknown) {
      const err = e as {
        response?: { status?: number; data?: { message?: string; code?: string } | string };
      };
      // Sem resposta = o servidor não foi alcançado (rede, URL ou porta errada), não é senha errada.
      if (!err.response) {
        return {
          success: false,
          error: 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
        };
      }
      const message =
        (err.response?.data as { message?: string })?.message ||
        err.response?.data ||
        'E-mail ou senha incorretos.';
      return {
        success: false,
        error: typeof message === 'string' ? message : 'E-mail ou senha incorretos.',
        // Senha certa, e-mail ainda não confirmado: a tela abre a confirmação.
        needsEmailVerification:
          err.response?.status === 403 &&
          (err.response?.data as { code?: string })?.code === 'EMAIL_NOT_VERIFIED',
      };
    }
  };

  const confirmEmail = async (email: string, code: string): Promise<AuthResult> => {
    try {
      await api.post('/auth/confirm-email', { email: email.trim(), code });
      return { success: true };
    } catch (e: unknown) {
      return { success: false, error: apiErrorMessage(e, 'Não foi possível confirmar o e-mail.') };
    }
  };

  // O backend responde igual exista a conta ou não; só falha por rede ou e-mail malformado.
  const resendConfirmation = async (email: string): Promise<AuthResult> => {
    try {
      await api.post('/auth/resend-confirmation', { email: email.trim() });
      return { success: true };
    } catch (e: unknown) {
      return { success: false, error: apiErrorMessage(e, 'Não foi possível reenviar o código. Tente novamente.') };
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
      // Dados das telas ficam no aparelho por usuário; ao sair, saem todos.
      await clearResourceCache();
    } catch (e) {
      console.error('Erro ao limpar sessão do storage:', e);
    } finally {
      // Junto com o currentUser nulo (isLoggedIn false): o roteamento já monta a auth stack
      // direto no Login (e não no card de usuário persistente / Welcome).
      setJustLoggedOut(true);
      setCurrentUser(null);
      setRememberedUser(null);
      setHasOnboarded(false);
    }
  }, []);

  useEffect(() => {
    setSignOutHandler(signOut);
    return () => setSignOutHandler(null);
  }, [signOut]);

  // Termos atualizados com o app aberto: a API passa a responder TERMS_REQUIRED e o
  // roteamento volta para a tela de aceite.
  useEffect(() => {
    setTermsRequiredHandler(() =>
      setCurrentUser((user) => (user && user.termsAccepted !== false ? { ...user, termsAccepted: false } : user)),
    );
    return () => setTermsRequiredHandler(null);
  }, []);

  const completeOnboarding = async (
    data: CompleteOnboardingData,
  ): Promise<void> => {
    if (!currentUser) return;

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

  // "Já possuo treino": sai do onboarding sem gerar ficha (o card da Home continua oferecendo).
  const skipOnboarding = async (): Promise<void> => {
    if (!currentUser) return;
    const updatedUser: KineticUser = { ...currentUser, onboardingSkipped: true };
    setCurrentUser(updatedUser);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    setHasOnboarded(true);
  };

  // O backend responde igual exista a conta ou não; só falha por rede ou e-mail malformado.
  const requestPasswordReset = async (email: string): Promise<AuthResult> => {
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      return { success: true };
    } catch (e: unknown) {
      return { success: false, error: apiErrorMessage(e, 'Não foi possível enviar o código. Tente novamente.') };
    }
  };

  const resetPassword = async (
    email: string,
    code: string,
    newPassword: string,
  ): Promise<AuthResult> => {
    try {
      await api.post('/auth/reset-password', {
        email: email.trim(),
        code,
        newPassword,
      });
      return { success: true };
    } catch (e: unknown) {
      return { success: false, error: apiErrorMessage(e, 'Erro ao redefinir a senha.') };
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
      return { success: false, error: apiErrorMessage(e, 'Erro ao alterar a senha.') };
    }
  };

  // Cadastro/troca do celular; o backend devolve só DDD + número.
  const updatePhone = async (phone: string): Promise<AuthResult> => {
    if (!currentUser) return { success: false, error: 'Sessão expirada. Entre novamente.' };
    try {
      const response = await api.put<{ phone: string }>('/users/phone', { phone });
      const updatedUser: KineticUser = { ...currentUser, phone: response.data.phone };

      // Sem celular o backend barra /workouts/my-plans (PHONE_REQUIRED), então a checagem
      // de fichas existentes feita no login falhou; refaz antes de liberar o roteamento
      // para não cair no onboarding à toa.
      if (!hasOnboarded) await markOnboardedIfHasPlans();

      await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      return { success: true };
    } catch (e: unknown) {
      const err = e as { response?: { data?: unknown } };
      const message = err.response?.data;
      return {
        success: false,
        error: typeof message === 'string' && message ? message : 'Não foi possível salvar o celular.',
      };
    }
  };

  const acceptTerms = async (): Promise<AuthResult> => {
    if (!currentUser) return { success: false, error: 'Sessão expirada. Entre novamente.' };
    try {
      await api.post('/users/me/terms-acceptance');
      const updatedUser: KineticUser = { ...currentUser, termsAccepted: true };
      // Como no celular: sem o aceite o backend barrou /workouts/my-plans no login.
      if (!hasOnboarded) await markOnboardedIfHasPlans();
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      return { success: true };
    } catch {
      return { success: false, error: 'Não foi possível registrar o aceite. Tente novamente.' };
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
        justLoggedOut,
        signIn,
        signOut,
        unlockSession,
        forgetRememberedUser,
        register,
        completeOnboarding,
        skipOnboarding,
        confirmEmail,
        resendConfirmation,
        requestPasswordReset,
        resetPassword,
        changePassword,
        updatePhone,
        acceptTerms,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
