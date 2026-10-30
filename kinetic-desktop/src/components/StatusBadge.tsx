import type { ReactNode } from 'react';
import type { UserStatus } from '../types';

const MAP: Record<UserStatus, { label: string; tone: string; dot: string }> = {
  ATIVO: { label: 'Ativo', tone: 'bg-k-success/[0.12] text-k-success', dot: 'bg-k-success' },
  SUSPENSO: { label: 'Suspenso', tone: 'bg-k-warn/[0.12] text-k-warn', dot: 'bg-k-warn' },
  BLOQUEADO: { label: 'Bloqueado', tone: 'bg-k-alert/[0.12] text-k-alert', dot: 'bg-k-alert' },
};

/** Selo de estado de compliance de uma conta (ATIVO/SUSPENSO/BLOQUEADO), no padrão dos selos do painel. */
export default function StatusBadge({ status }: { status: UserStatus }) {
  const s = MAP[status];
  return (
    <span
      className={`inline-flex w-fit shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-semibold leading-none ${s.tone}`}
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

/** Chip neutro de rótulo curto (papel da conta, "Protegido", "Convite pendente"…). */
export function TagChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex w-fit shrink-0 items-center gap-1 whitespace-nowrap rounded-md bg-white/[0.06] px-2 py-1 text-[11px] font-semibold leading-none text-k-text-dim">
      {children}
    </span>
  );
}
