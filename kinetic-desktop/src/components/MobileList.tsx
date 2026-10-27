import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { MoreVertical, type LucideIcon } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

/**
 * Celular: as tabelas das telas de gestão viram esta lista de cartões (a tabela
 * continua do md em diante). Cada linha mostra o essencial e guarda as ações num menu ⋮.
 */
export function MobileList({ children }: { children: ReactNode }) {
  return (
    <ul className="divide-y divide-white/[0.06] overflow-hidden rounded-xl border border-white/[0.08] md:hidden">
      {children}
    </ul>
  );
}

/** Ícone de entidade (empresa, filial) no lugar do avatar, no ciano da marca. */
export function ListIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-k-primary-dim text-k-primary">
      <Icon className="h-[18px] w-[18px]" />
    </span>
  );
}

export interface RowAction {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

export function MobileListItem({
  leading,
  title,
  subtitle,
  meta,
  trailing,
  to,
  actions,
  actionsLabel,
}: {
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Linha de detalhes (selo de status, contagens), em fonte menor. */
  meta?: ReactNode;
  /** Algo fixo à direita (um botão de ícone, "protegido"…). */
  trailing?: ReactNode;
  /** Linha inteira abre esta rota. */
  to?: string;
  actions?: RowAction[];
  /** Nome acessível do botão ⋮ (ex.: "Ações de Fulano"). */
  actionsLabel?: string;
}) {
  const content = (
    <>
      <p className="truncate text-sm font-semibold">{title}</p>
      {subtitle && <p className="truncate text-xs text-k-text-muted">{subtitle}</p>}
      {meta && <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-k-text-muted">{meta}</div>}
    </>
  );
  return (
    <li className="flex items-center gap-3.5 px-4 py-3.5 transition-colors active:bg-white/[0.03]">
      {leading}
      {to ? (
        <Link to={to} className="min-w-0 flex-1">
          {content}
        </Link>
      ) : (
        <div className="min-w-0 flex-1">{content}</div>
      )}
      {trailing}
      {actions && actions.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={actionsLabel ?? 'Ações'}
            className="-mr-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-k-text-dim hover:bg-white/[0.06] hover:text-k-text"
          >
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {actions.map(({ label, icon: Icon, onClick, destructive, disabled }) => (
              <DropdownMenuItem
                key={label}
                variant={destructive ? 'destructive' : 'default'}
                disabled={disabled}
                onClick={onClick}
              >
                {Icon && <Icon className="h-4 w-4" />} {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </li>
  );
}
