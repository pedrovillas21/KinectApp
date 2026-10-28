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
 * Papéis do painel (ALUNO fica de fora — usa o app), home de cada papel e a barra
 * lateral do AppShell (ROOT, EMPRESA e DONO; o PERSONAL tem a própria, no PersonalShell).
 */

/** EMPRESA = conta de uma filial; DONO = dono da rede, que cadastra e acompanha as filiais. */
export type PanelRole = 'PERSONAL' | 'EMPRESA' | 'DONO' | 'ROOT';

/** True só para papéis que podem logar no painel web (ALUNO é barrado). */
export const isPanelRole = (role: string | null | undefined): role is PanelRole =>
  role === 'PERSONAL' || role === 'EMPRESA' || role === 'DONO' || role === 'ROOT';

/** Home de cada papel — usado no pós-login e nos redirects role-aware. */
export const ROLE_HOME: Record<PanelRole, string> = {
  PERSONAL: '/students',
  ROOT: '/root',
  EMPRESA: '/empresa',
  DONO: '/dono',
};

/** Rota inicial do papel; papéis fora do painel caem no /login. */
export const homeForRole = (role: string | null | undefined): string =>
  isPanelRole(role) ? ROLE_HOME[role] : '/login';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  /** Rótulo curto da barra inferior do celular (sem ele, usa `label`). */
  shortLabel?: string;
  /** Item visível mas em construção — rota renderiza estado "em breve". */
  comingSoon?: boolean;
}

export const NAV_BY_ROLE: Record<Exclude<PanelRole, 'PERSONAL'>, NavItem[]> = {
  ROOT: [
    { label: 'Visão Geral', shortLabel: 'Início', path: '/root', icon: LayoutDashboard },
    { label: 'Empresas', path: '/root/empresas', icon: Building2 },
    { label: 'Personais', path: '/root/personais', icon: UserCog },
    { label: 'Usuários & Compliance', shortLabel: 'Usuários', path: '/root/usuarios', icon: ShieldCheck },
    { label: 'Auditoria', path: '/root/auditoria', icon: ScrollText, comingSoon: true },
    { label: 'Faturamento', path: '/root/faturamento', icon: CreditCard, comingSoon: true },
  ],
  EMPRESA: [
    { label: 'Visão Geral', shortLabel: 'Início', path: '/empresa', icon: LayoutDashboard },
    { label: 'Funcionários', shortLabel: 'Equipe', path: '/empresa/funcionarios', icon: UserCog },
    { label: 'Clientes', path: '/empresa/clientes', icon: Users },
    { label: 'Feedbacks', path: '/empresa/feedbacks', icon: MessageSquareText },
    { label: 'Analytics', path: '/empresa/analytics', icon: BarChart3 },
  ],
  DONO: [
    { label: 'Visão Geral', shortLabel: 'Início', path: '/dono', icon: LayoutDashboard },
    { label: 'Filiais', path: '/dono/filiais', icon: Building2 },
  ],
};
