import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { Download, Menu, Share, X, type LucideIcon } from 'lucide-react';

export interface MobileTab {
  label: string;
  to: string;
  icon: LucideIcon;
  /** NavLink `end`: a home do papel só fica ativa na própria rota. */
  end?: boolean;
}

/**
 * Navegação do celular (abaixo de md): barra inferior com os destinos principais +
 * "Menu", que abre uma gaveta com o mesmo conteúdo da barra lateral do desktop.
 * A gaveta fecha sozinha ao trocar de rota.
 */
export default function MobileNav({ tabs, drawer }: { tabs: MobileTab[]; drawer: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <nav
        aria-label="Principal"
        className="flex shrink-0 border-t border-white/[0.07] bg-[#161616] pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {tabs.map(({ label, to, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex h-[60px] min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[11px] transition-colors ${
                isActive ? 'text-k-primary' : 'text-k-text-muted'
              }`
            }
          >
            <Icon className="h-5 w-5" strokeWidth={1.8} />
            <span className="max-w-full truncate px-1">{label}</span>
          </NavLink>
        ))}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-[60px] min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[11px] text-k-text-muted"
        >
          <Menu className="h-5 w-5" strokeWidth={1.8} />
          Menu
        </button>
      </nav>

      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content
            aria-describedby={undefined}
            className="fixed inset-y-0 left-0 z-50 flex w-[284px] max-w-[85vw] flex-col gap-6 overflow-y-auto border-r border-white/[0.07] bg-[#161616] px-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] outline-none duration-200 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:animate-in data-[state=open]:slide-in-from-left"
          >
            <DialogPrimitive.Title className="sr-only">Menu</DialogPrimitive.Title>
            <DialogPrimitive.Close
              aria-label="Fechar menu"
              className="absolute right-3 top-[max(1rem,env(safe-area-inset-top))] flex h-9 w-9 items-center justify-center rounded-lg text-k-text-muted hover:bg-white/[0.06] hover:text-k-text"
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
            {drawer}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// O evento dispara uma vez, cedo, às vezes antes do shell montar: guarda em módulo.
let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    listeners.forEach((l) => l());
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    listeners.forEach((l) => l());
  });
}

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

/**
 * "Instalar app": no Android/Chrome usa o prompt nativo do PWA; no iPhone (sem prompt)
 * explica o "Compartilhar → Adicionar à Tela de Início". Some quando já está instalado.
 */
export function InstallAppButton() {
  const [, rerender] = useState(0);
  const [iosHelp, setIosHelp] = useState(false);

  useEffect(() => {
    const l = () => rerender((n) => n + 1);
    listeners.add(l);
    return () => void listeners.delete(l);
  }, []);

  if (isStandalone()) return null;
  const ios = isIos();
  if (!deferredPrompt && !ios) return null;

  const install = async () => {
    if (!deferredPrompt) return setIosHelp((v) => !v);
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    rerender((n) => n + 1);
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => void install()}
        className="flex h-10 items-center gap-2.5 rounded-lg border border-k-primary/25 bg-k-primary/[0.06] px-2.5 text-sm text-k-text transition-colors hover:bg-k-primary/[0.1]"
      >
        <Download className="h-4 w-4 text-k-primary" strokeWidth={1.8} />
        Instalar o app
      </button>
      {iosHelp && (
        <p className="px-1 text-xs leading-relaxed text-k-text-muted">
          No Safari, toque em <Share className="inline h-3.5 w-3.5 align-[-2px]" /> Compartilhar e depois em
          “Adicionar à Tela de Início”.
        </p>
      )}
    </div>
  );
}
