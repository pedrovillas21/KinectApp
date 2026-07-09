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
import {
  getRefreshToken,
  clearTokens,
  setTokens,
} from '../services/tokenStorage';

const USER_KEY = 'kinetic_web_user';

// ─── Types ────────────────────────────────────────────────────────────────

/** Usuário logado no painel — sempre role PERSONAL (o login barra os demais). */
export interface KineticWebUser {
  id: string;
  nome: string;
  email: string;
  role: string;
}

type AuthResult = { success: true } | { success: false; error: string };

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
  }) => Promise<AuthResult>;
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
  'Este painel é exclusivo para personal trainers. Use o app Kinetic no celular para acessar sua conta de aluno.';

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

  // Restaura a sessão: usuário salvo + refresh token válido → logado.
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const userJson = localStorage.getItem(USER_KEY);
        const storedRefresh = await getRefreshToken();
        if (!userJson || !storedRefresh) return;

        const user = JSON.parse(userJson) as KineticWebUser;
        if (user.role !== 'PERSONAL') {
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
      const response = await api.post<LoginResponse>('/auth/login', {
        email: email.trim(),
        senha: password,
      });

      const { token, refreshToken, id, nome, email: userEmail, role } = response.data;

      // Gate de papel: o painel é só do PERSONAL. Não persiste nada de quem
      // não é — os tokens da resposta são simplesmente descartados.
      if (role !== 'PERSONAL') {
        return { success: false, error: ROLE_BLOCKED_ERROR };
      }

      const user: KineticWebUser = { id: String(id), nome, email: userEmail, role };

      await setTokens(token, refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      setCurrentUser(user);
      setIsLoggedIn(true);
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

  /** Cadastro de personal — envia role PERSONAL (whitelist do backend). */
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
        role: 'PERSONAL',
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
      const refreshToken = await getRefreshToken();
      if (refreshToken) {
        await logoutUser(refreshToken);
      }
      await clearTokens();
      localStorage.removeItem(USER_KEY);
    } finally {
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
      value={{ isLoggedIn, currentUser, isLoadingAuth, signIn, signOut, register }}
    >
      {children}
    </AuthContext.Provider>
  );
};
