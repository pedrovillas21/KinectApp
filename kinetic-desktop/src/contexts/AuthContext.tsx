import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import api, {
  setSignOutHandler,
  refreshAccessToken,
  logoutUser,
} from '../services/api';
import { clearTokens, setAccessToken } from '../services/tokenStorage';
import { queryClient } from '../services/queryClient';
import { isPanelRole } from '../config/nav';

const USER_KEY = 'kinetic_web_user';

// ─── Types ────────────────────────────────────────────────────────────────

/**
 * Usuário logado no painel. `role` é um dos papéis do painel (PERSONAL,
 * EMPRESA, DONO ou ROOT) — o login barra ALUNO e qualquer papel desconhecido.
 */
export interface KineticWebUser {
  id: string;
  nome: string;
  email: string;
  role: string;
}

/** Senha certa de conta de gestão (dono, filial, ROOT): falta o código do app autenticador. */
export interface SecondFactorChallenge {
  challengeToken: string;
  setupRequired: boolean;
}

type AuthResult =
  | { success: true; recoveryCodes?: string[]; finish?: () => Promise<AuthResult> }
  | {
      success: false;
      error: string;
      needsEmailVerification?: boolean;
      secondFactor?: SecondFactorChallenge;
    };

interface AuthContextValue {
  isLoggedIn: boolean;
  currentUser: KineticWebUser | null;
  /** True enquanto o bootstrap (restauração da sessão salva) não terminou. */
  isLoadingAuth: boolean;
  signIn: (args: { email: string; password: string }) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  register: (args: {
    name: string;
    email: string;
    password: string;
    cpf: string;
    phone: string;
  }) => Promise<AuthResult>;
  /** Primeiro acesso: endereço do QR code e segredo para digitar à mão no app autenticador. */
  totpSetup: (challengeToken: string) => Promise<{ otpauthUri: string; secret: string } | { error: string }>;
  /** Código do app (ou de recuperação, com recovery=true); abre a sessão. */
  totpVerify: (challengeToken: string, code: string, recovery?: boolean) => Promise<AuthResult>;
  confirmEmail: (email: string, code: string) => Promise<AuthResult>;
  resendConfirmation: (email: string) => Promise<AuthResult>;
  requestPasswordReset: (email: string) => Promise<AuthResult>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<AuthResult>;
}

interface LoginResponse {
  token: string;
  refreshToken: string;
  id: string;
  nome: string;
  email: string;
  role: string | null;
}

const ROLE_BLOCKED_ERROR =
  'Este painel é para personais, empresas e administradores. Use o app Kinetic no celular para acessar sua conta de aluno.';

// ─── Context ──────────────────────────────────────────────────────────────

export const AuthContext = createContext<AuthContextValue>(
  {} as AuthContextValue,
);

export const useAuth = (): AuthContextValue => useContext(AuthContext);

// ─── Provider ─────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<KineticWebUser | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Restaura a sessão: usuário salvo + cookie de refresh válido → logado.
  // O cookie é HttpOnly (não dá pra checar sua existência aqui), então a
  // única forma de confirmar é tentar o refresh e ver se o backend aceita.
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const userJson = localStorage.getItem(USER_KEY);
        if (!userJson) return;

        const user = JSON.parse(userJson) as KineticWebUser;
        if (!isPanelRole(user.role)) {
          await clearSession();
          return;
        }

        const newToken = await refreshAccessToken();
        if (!newToken) {
          await clearSession();
          return;
        }

        setCurrentUser(user);
        setIsLoggedIn(true);
      } catch {
        await clearSession();
      } finally {
        setIsLoadingAuth(false);
      }
    };
    void bootstrap();
  }, []);

  const clearSession = async (): Promise<void> => {
    await clearTokens();
    localStorage.removeItem(USER_KEY);
    queryClient.clear();
  };

  const signIn = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<AuthResult> => {
    if (!email || !password) {
      return { success: false, error: 'Preencha o e-mail (ou usuário) e a senha.' };
    }

    try {
      // O campo "email" aceita também o usuário da filial (rede.filial).
      const response = await api.post<LoginResponse>('/auth/login', {
        email: email.trim(),
        senha: password,
      });
      return await startSession(response.data);
    } catch (e: unknown) {
      const err = e as {
        response?: {
          status?: number;
          data?: { message?: string; code?: string; challengeToken?: string } | string;
        };
      };
      const data = typeof err.response?.data === 'object' ? err.response.data : undefined;
      const code = data?.code;
      const message = data?.message || err.response?.data || 'Usuário ou senha incorretos.';
      return {
        success: false,
        error: typeof message === 'string' ? message : 'Usuário ou senha incorretos.',
        // Senha certa, e-mail ainda não confirmado: a página leva à confirmação.
        needsEmailVerification: err.response?.status === 403 && code === 'EMAIL_NOT_VERIFIED',
        // Senha certa de conta de gestão: a página leva à etapa do app autenticador.
        secondFactor:
          err.response?.status === 403 && (code === 'TOTP_REQUIRED' || code === 'TOTP_SETUP_REQUIRED')
            ? { challengeToken: data?.challengeToken ?? '', setupRequired: code === 'TOTP_SETUP_REQUIRED' }
            : undefined,
      };
    }
  };

  /** Grava a sessão de um login concluído (senha, ou senha + código do app autenticador). */
  const startSession = async (data: LoginResponse): Promise<AuthResult> => {
    const { token, id, nome, email: userEmail, role } = data;

    // Gate de papel: o painel aceita PERSONAL, EMPRESA, DONO e ROOT — ALUNO (e
    // qualquer papel desconhecido) é barrado. Não persiste nada de quem não
    // é do painel — o access token é descartado e o cookie de refresh (já
    // gravado pelo backend na resposta) é limpo no logout best-effort.
    if (!isPanelRole(role)) {
      await logoutUser();
      return { success: false, error: ROLE_BLOCKED_ERROR };
    }

    const user: KineticWebUser = { id: String(id), nome, email: userEmail, role };

    await setAccessToken(token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setCurrentUser(user);
    setIsLoggedIn(true);
    return { success: true };
  };

  const errorMessage = (e: unknown, fallback: string): string => {
    const data = (e as { response?: { data?: unknown } }).response?.data;
    if (typeof data === 'string' && data) return data;
    const message = (data as { message?: string } | undefined)?.message;
    return message || fallback;
  };

  const totpSetup = async (challengeToken: string) => {
    try {
      const res = await api.post<{ otpauthUri: string; secret: string }>('/auth/totp/setup', { challengeToken });
      return res.data;
    } catch (e: unknown) {
      return { error: errorMessage(e, 'Não foi possível iniciar o cadastro do app. Entre com a senha de novo.') };
    }
  };

  const totpVerify = async (challengeToken: string, code: string, recovery = false): Promise<AuthResult> => {
    try {
      const res = await api.post<{ session: LoginResponse; recoveryCodes: string[] }>(
        recovery ? '/auth/totp/recover' : '/auth/totp/verify',
        { challengeToken, code: code.trim() },
      );
      const codes = res.data.recoveryCodes ?? [];
      // Primeiro acesso: a sessão só abre depois que a pessoa guardar os códigos de
      // recuperação (abrir antes redirecionaria a tela e os códigos sumiriam).
      if (codes.length > 0) {
        return { success: true, recoveryCodes: codes, finish: () => startSession(res.data.session) };
      }
      return await startSession(res.data.session);
    } catch (e: unknown) {
      return { success: false, error: errorMessage(e, 'Código inválido. Tente o código atual do app.') };
    }
  };

  const confirmEmail = async (email: string, code: string): Promise<AuthResult> => {
    try {
      await api.post('/auth/confirm-email', { email: email.trim(), code });
      return { success: true };
    } catch (e: unknown) {
      const err = e as { response?: { data?: unknown } };
      const message = err.response?.data || 'Não foi possível confirmar o e-mail.';
      return {
        success: false,
        error: typeof message === 'string' ? message : JSON.stringify(message),
      };
    }
  };

  // O backend responde igual exista a conta ou não; só falha por rede ou e-mail malformado.
  const resendConfirmation = async (email: string): Promise<AuthResult> => {
    try {
      await api.post('/auth/resend-confirmation', { email: email.trim() });
      return { success: true };
    } catch (e: unknown) {
      const err = e as { response?: { data?: unknown } };
      const message = err.response?.data || 'Não foi possível reenviar o código. Tente novamente.';
      return {
        success: false,
        error: typeof message === 'string' ? message : JSON.stringify(message),
      };
    }
  };

  // Resposta uniforme, exista a conta ou não; só falha por rede ou e-mail malformado.
  const requestPasswordReset = async (email: string): Promise<AuthResult> => {
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      return { success: true };
    } catch (e: unknown) {
      const err = e as { response?: { data?: unknown } };
      const message = err.response?.data || 'Não foi possível enviar o código. Tente novamente.';
      return {
        success: false,
        error: typeof message === 'string' ? message : JSON.stringify(message),
      };
    }
  };

  const resetPassword = async (email: string, code: string, newPassword: string): Promise<AuthResult> => {
    try {
      await api.post('/auth/reset-password', { email: email.trim(), code, newPassword });
      return { success: true };
    } catch (e: unknown) {
      const err = e as { response?: { data?: unknown } };
      const message = err.response?.data || 'Não foi possível redefinir a senha.';
      return {
        success: false,
        error: typeof message === 'string' ? message : JSON.stringify(message),
      };
    }
  };

  /** Cadastro de personal — envia role PERSONAL (whitelist do backend). */
  const register = async ({
    name,
    email,
    password,
    cpf,
    phone,
  }: {
    name: string;
    email: string;
    password: string;
    cpf: string;
    phone: string;
  }): Promise<AuthResult> => {
    if (!name || !email || !password || !cpf || !phone) {
      return { success: false, error: 'Preencha todos os campos.' };
    }

    try {
      await api.post('/auth/register', {
        nome: name.trim(),
        email: email.trim(),
        senha: password,
        role: 'PERSONAL',
        cpf: cpf.trim(),
        phone: phone.replace(/\D/g, ''),
        // A página só chama depois da caixa "Li e aceito" marcada.
        termsAccepted: true,
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

  const signOut = useCallback(async (): Promise<void> => {
    try {
      // O refresh token vai no cookie HttpOnly; o backend o revoga e limpa
      // o cookie na resposta.
      await logoutUser();
      await clearTokens();
      localStorage.removeItem(USER_KEY);
    } finally {
      // Outro login na mesma máquina não pode ver dados em cache da conta anterior.
      queryClient.clear();
      setCurrentUser(null);
      setIsLoggedIn(false);
    }
  }, []);

  // Mesmo padrão do mobile: um 401 sem refresh válido derruba a sessão.
  useEffect(() => {
    setSignOutHandler(signOut);
    return () => setSignOutHandler(null);
  }, [signOut]);

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        currentUser,
        isLoadingAuth,
        signIn,
        signOut,
        register,
        totpSetup,
        totpVerify,
        confirmEmail,
        resendConfirmation,
        requestPasswordReset,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
