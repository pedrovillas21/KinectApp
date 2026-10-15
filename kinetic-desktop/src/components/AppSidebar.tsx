import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Activity, LogOut, MessageCircle } from 'lucide-react';
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
import PhoneDialog from './PhoneDialog';
import { getMyPhone } from '../services/userService';
import { maskCellPhone } from '../utils/whatsapp';

const ROLE_SUBTITLE: Record<PanelRole, string> = {
  PERSONAL: 'Painel do Personal',
  ROOT: 'Administração Global',
  EMPRESA: 'Painel da Empresa',
};

/**
 * Sidebar do painel, alimentada por config/nav.ts conforme o papel logado.
 * Item ativo via casamento de rota; rodapé com usuário logado + logout.
 * O PERSONAL também edita ali o próprio celular (atalho de WhatsApp dos alunos).
 */
export default function AppSidebar() {
  const { currentUser, signOut } = useAuth();
  const { pathname } = useLocation();
  const role = currentUser?.role;
  const items = isPanelRole(role) ? NAV_BY_ROLE[role] : [];
  const subtitle = isPanelRole(role) ? ROLE_SUBTITLE[role] : 'Kinetic';
  const homePath = isPanelRole(role) ? ROLE_HOME[role] : '/';

  const initial = (currentUser?.nome.trim().charAt(0) || '?').toUpperCase();

  const isPersonal = role === 'PERSONAL';
  const [phone, setPhone] = useState<string | null>(null);
  const [phoneOpen, setPhoneOpen] = useState(false);

  useEffect(() => {
    if (!isPersonal) return;
    getMyPhone()
      .then(setPhone)
      .catch(() => setPhone(null));
  }, [isPersonal]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center bg-gradient-to-br from-k-primary to-k-primary-deep text-k-on-primary shadow-[0_0_12px_rgba(0,229,255,0.25)]">
            <Activity className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-extrabold tracking-tight leading-tight">Kinetic</span>
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
          {isPersonal && (
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Meu WhatsApp" onClick={() => setPhoneOpen(true)}>
                <MessageCircle />
                <span className="flex-1 truncate">
                  {phone ? maskCellPhone(phone) : 'Cadastrar WhatsApp'}
                </span>
                {!phone && (
                  <Badge
                    variant="outline"
                    className="text-[9px] px-1.5 py-0 h-4 border-k-warn/40 text-k-warn group-data-[collapsible=icon]:hidden"
                  >
                    pendente
                  </Badge>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
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

      {isPersonal && (
        <PhoneDialog open={phoneOpen} onOpenChange={setPhoneOpen} phone={phone} onSaved={setPhone} />
      )}
    </Sidebar>
  );
}
