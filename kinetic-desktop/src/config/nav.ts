import {
  LayoutDashboard,
  Building2,
  UserCog,
  ShieldCheck,
  ScrollText,
  CreditCard,
  Users,
  MessageSquareText,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';

/**
 * Fonte única da navegação do painel: itens de sidebar keyed por papel, mapa
 * papel → home e o gate de "papéis do painel" (ALUNO fica de fora — usa o app).
 * Consumido por AppSidebar, AuthContext, ProtectedRoute e LoginPage.
 */

export type PanelRole = 'PERSONAL' | 'EMPRESA' | 'ROOT';

export const PANEL_ROLES: readonly PanelRole[] = ['PERSONAL', 'EMPRESA', 'ROOT'];

/** True só para papéis que podem logar no painel web (ALUNO é barrado). */
export const isPanelRole = (role: string | null | undefined): role is PanelRole =>
  role === 'PERSONAL' || role === 'EMPRESA' || role === 'ROOT';

/** Home de cada papel — usado no pós-login e nos redirects role-aware. */
export const ROLE_HOME: Record<PanelRole, string> = {
  PERSONAL: '/students',
  ROOT: '/root',
  EMPRESA: '/empresa',
};

/** Rota inicial do papel; papéis fora do painel caem no /login. */
export const homeForRole = (role: string | null | undefined): string =>
  isPanelRole(role) ? ROLE_HOME[role] : '/login';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  /** Item visível mas em construção — rota renderiza estado "em breve". */
  comingSoon?: boolean;
}

export const NAV_BY_ROLE: Record<PanelRole, NavItem[]> = {
  PERSONAL: [{ label: 'Alunos', path: '/students', icon: Users }],
  ROOT: [
    { label: 'Visão Geral', path: '/root', icon: LayoutDashboard },
    { label: 'Empresas', path: '/root/empresas', icon: Building2 },
    { label: 'Personais', path: '/root/personais', icon: UserCog },
    { label: 'Usuários & Compliance', path: '/root/usuarios', icon: ShieldCheck },
    { label: 'Auditoria', path: '/root/auditoria', icon: ScrollText, comingSoon: true },
    { label: 'Faturamento', path: '/root/faturamento', icon: CreditCard, comingSoon: true },
  ],
  EMPRESA: [
    { label: 'Visão Geral', path: '/empresa', icon: LayoutDashboard },
    { label: 'Funcionários', path: '/empresa/funcionarios', icon: UserCog },
    { label: 'Clientes', path: '/empresa/clientes', icon: Users },
    { label: 'Feedbacks', path: '/empresa/feedbacks', icon: MessageSquareText },
    { label: 'Analytics', path: '/empresa/analytics', icon: BarChart3 },
  ],
};
