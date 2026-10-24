import { NavLink, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  NAV_BY_ROLE,
  ROLE_HOME,
  isPanelRole,
  type PanelRole,
} from '../config/nav';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';

const ROLE_SUBTITLE: Record<PanelRole, string> = {
  PERSONAL: 'Painel do Personal',
  ROOT: 'Administração Global',
  EMPRESA: 'Painel da Empresa',
};

/**
 * Sidebar do painel, alimentada por config/nav.ts conforme o papel logado.
 * Item ativo via casamento de rota; rodapé com usuário logado + logout.
 */
export default function AppSidebar() {
  const { currentUser, signOut } = useAuth();
  const { pathname } = useLocation();
  const role = currentUser?.role;
  const items = isPanelRole(role) ? NAV_BY_ROLE[role] : [];
  const subtitle = isPanelRole(role) ? ROLE_SUBTITLE[role] : 'Kinetic';
  const homePath = isPanelRole(role) ? ROLE_HOME[role] : '/';

  const initial = (currentUser?.nome.trim().charAt(0) || '?').toUpperCase();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-3 px-2 py-2">
          <svg width="22" height="17" viewBox="0 0 26 20" aria-hidden="true" className="shrink-0">
            <path d="M6 0h6L6 20H0z" fill="#00E5FF" />
            <path d="M15 0h6l-6 20H9z" fill="#00E5FF" opacity="0.55" />
            <path d="M24 0h2l-6 20h-2z" fill="#00E5FF" opacity="0.25" />
          </svg>
          <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-extrabold italic tracking-[0.06em] leading-tight">KINETIC</span>
            <span className="text-[11px] text-k-text-muted truncate">{subtitle}</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active =
                  item.path === homePath
                    ? pathname === item.path
                    : pathname === item.path || pathname.startsWith(`${item.path}/`);
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                      <NavLink to={item.path}>
                        <item.icon />
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.comingSoon && (
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1.5 py-0 h-4 border-k-ghost text-k-text-muted group-data-[collapsible=icon]:hidden"
                          >
                            em breve
                          </Badge>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2.5 px-2 py-1.5 group-data-[collapsible=icon]:hidden">
              <div className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center bg-k-primary-dim border border-k-primary-soft text-k-primary text-xs font-bold">
                {initial}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-bold truncate">{currentUser?.nome}</span>
                <span className="text-[10px] text-k-text-muted truncate">{currentUser?.email}</span>
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sair"
              onClick={() => void signOut()}
              className="text-k-text-dim hover:text-k-error"
            >
              <LogOut />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
