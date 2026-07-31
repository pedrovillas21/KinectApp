import type { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  /** Slot à direita para ações (botões, seletor de período). */
  actions?: ReactNode;
}

/** Cabeçalho padrão das páginas dentro do AppShell (substitui os headers hand-made). */
export default function PageHeader({ title, subtitle, icon, actions }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 px-6 pt-6 pb-4 border-b border-k-ghost/40">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-9 h-9 shrink-0 rounded-xl bg-k-surface2 border border-k-ghost flex items-center justify-center text-k-primary">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-lg font-extrabold tracking-tight">{title}</h1>
          {subtitle && <p className="text-xs text-k-text-muted mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
