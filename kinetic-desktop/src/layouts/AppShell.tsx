import { Outlet } from 'react-router-dom';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import AppSidebar from '../components/AppSidebar';

/**
 * App-shell dos papéis com sidebar (ROOT e EMPRESA): sidebar colapsável +
 * área de conteúdo com <Outlet/>. O scroll vive no painel de conteúdo — a
 * página nunca rola (reset de SPA em theme.css).
 */
export default function AppShell() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="h-screen min-h-0 overflow-hidden flex flex-col bg-k-bg">
        {/* Barra fina só para o gatilho de colapso/drawer (mobile e desktop). */}
        <header className="flex items-center gap-2 h-12 shrink-0 border-b border-k-ghost px-3 md:hidden">
          <SidebarTrigger className="text-k-text-dim" />
          <span className="text-sm font-bold">Kinetic</span>
        </header>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
