import { useEffect, useId, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import KineticLogo from '../components/KineticLogo';
import Avatar from '../components/Avatar';
import { NAV_BY_ROLE, ROLE_HOME, isPanelRole, type NavItem } from '../config/nav';
import { isGroupOpen } from '../config/navGroups';
import MobileNav, { InstallAppButton } from './MobileNav';

/**
 * Moldura dos painéis ROOT, EMPRESA e DONO, no mesmo padrão do PersonalShell:
 * barra lateral fixa (marca, navegação do papel, conta) + conteúdo com scroll próprio.
 * No celular a barra lateral vira barra inferior + gaveta (MobileNav).
 */
export default function AppShell() {
  const { currentUser } = useAuth();
  const role = currentUser?.role;
  const items = isPanelRole(role) && role !== 'PERSONAL' ? NAV_BY_ROLE[role] : [];
  const home = isPanelRole(role) ? ROLE_HOME[role] : '/';
  const tabs = items
    .filter((i) => !i.comingSoon && !i.children)
    .slice(0, 4)
    .map((i) => ({ label: i.shortLabel ?? i.label, to: i.path, icon: i.icon, end: i.path === home }));

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-k-bg text-k-text md:flex-row">
      <aside className="hidden w-[232px] shrink-0 flex-col gap-6 border-r border-white/[0.07] bg-[#161616] px-3 py-5 md:flex">
        <SidebarContent items={items} home={home} />
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
        <Outlet />
      </div>

      <MobileNav tabs={tabs} drawer={<SidebarContent items={items} home={home} />} />
    </div>
  );
}

function SidebarContent({ items, home }: { items: NavItem[]; home: string }) {
  const { currentUser, signOut } = useAuth();

  return (
    <>
      <Link to={home} aria-label="Kinetic, visão geral" className="px-2.5 py-1">
        <KineticLogo size={19} />
      </Link>

      <nav aria-label="Principal" className="-mx-1 flex min-h-0 flex-col gap-0.5 overflow-y-auto px-1">
        {items.map((item) =>
          item.children ? (
            <NavGroup key={item.path} item={item} />
          ) : (
            <NavLink key={item.path} to={item.path} end={item.path === home} className={navLinkClass}>
              <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.8} />
              <span className="flex-1 truncate">{item.label}</span>
              {item.comingSoon && <span className="text-[11px] text-k-text-muted">Em breve</span>}
            </NavLink>
          ),
        )}
      </nav>

      <div className="mt-auto flex flex-col gap-3">
        <InstallAppButton />
        <div className="flex items-center gap-2.5 px-1.5">
          <Avatar name={currentUser?.nome ?? ''} size={32} />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[13px] font-medium">{currentUser?.nome}</p>
            <p className="truncate text-xs text-k-text-muted">{currentUser?.email}</p>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            aria-label="Sair"
            title="Sair"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-k-text-muted transition-colors hover:bg-white/[0.06] hover:text-k-alert"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex h-10 items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors ${
    isActive ? 'bg-white/[0.06] text-k-text' : 'text-k-text-dim hover:bg-white/[0.04] hover:text-k-text'
  }`;

/**
 * Item com submenu (ex.: Auditoria): botão que abre e fecha os filhos, recuados com
 * uma linha guia. Começa aberto (e reabre) quando a rota atual está dentro do grupo.
 */
function NavGroup({ item }: { item: NavItem }) {
  const { pathname } = useLocation();
  const inside = isGroupOpen(item.path, pathname);
  const [open, setOpen] = useState(inside);
  const listId = useId();
  const Icon = item.icon;

  useEffect(() => {
    if (inside) setOpen(true);
  }, [inside]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={listId}
        className={`flex h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-sm transition-colors hover:bg-white/[0.04] hover:text-k-text ${
          inside ? 'text-k-text' : 'text-k-text-dim'
        }`}
      >
        <Icon className="h-4 w-4 shrink-0" strokeWidth={1.8} />
        <span className="flex-1 truncate">{item.label}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-k-text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <ul id={listId} className="ml-[17px] mt-0.5 flex flex-col gap-0.5 border-l border-white/[0.08] pl-2">
          {item.children?.map((child) => (
            <li key={child.path}>
              <NavLink
                to={child.path}
                className={({ isActive }) =>
                  `flex h-9 items-center gap-2 rounded-lg px-2.5 text-[13px] transition-colors ${
                    isActive ? 'bg-white/[0.06] text-k-text' : 'text-k-text-dim hover:bg-white/[0.04] hover:text-k-text'
                  }`
                }
              >
                <child.icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
                <span className="truncate">{child.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
