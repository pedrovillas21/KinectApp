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
import { isPanelRole } from '../config/nav';

const USER_KEY = 'kinetic_web_user';

// ─── Types ────────────────────────────────────────────────────────────────

/**
 * Usuário logado no painel. `role` é um dos papéis do painel (PERSONAL,
 * EMPRESA ou ROOT) — o login barra ALUNO e qualquer papel desconhecido.
 */
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
    cpf: string;
  }) => Promise<AuthResult>;
  registerCompany: (args: {
    companyName: string;
    companyCnpj: string;
    ownerName: string;
    ownerEmail: string;
    ownerPassword: string;
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

      const { token, id, nome, email: userEmail, role } = response.data;

      // Gate de papel: o painel aceita PERSONAL, EMPRESA e ROOT — ALUNO (e
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
    cpf,
  }: {
    name: string;
    email: string;
    password: string;
    cpf: string;
  }): Promise<AuthResult> => {
    if (!name || !email || !password || !cpf) {
      return { success: false, error: 'Preencha todos os campos.' };
    }

    try {
      await api.post('/auth/register', {
        nome: name.trim(),
        email: email.trim(),
        senha: password,
        role: 'PERSONAL',
        cpf: cpf.trim(),
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

  /** Cadastro de empresa (Company + dono com papel EMPRESA) */
  const registerCompany = async ({
    companyName,
    companyCnpj,
    ownerName,
    ownerEmail,
    ownerPassword,
  }: {
    companyName: string;
    companyCnpj: string;
    ownerName: string;
    ownerEmail: string;
    ownerPassword: string;
  }): Promise<AuthResult> => {
    if (!companyName || !companyCnpj || !ownerName || !ownerEmail || !ownerPassword) {
      return { success: false, error: 'Preencha todos os campos.' };
    }

    try {
      await api.post('/auth/register-company', {
        companyName: companyName.trim(),
        companyCnpj: companyCnpj.trim(),
        ownerName: ownerName.trim(),
        ownerEmail: ownerEmail.trim(),
        ownerPassword: ownerPassword,
      });
      return { success: true };
    } catch (e: unknown) {
      const err = e as { response?: { data?: unknown } };
      const message = err.response?.data || 'Erro ao cadastrar empresa. Tente novamente.';
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
      value={{ isLoggedIn, currentUser, isLoadingAuth, signIn, signOut, register, registerCompany }}
    >
      {children}
    </AuthContext.Provider>
  );
};
