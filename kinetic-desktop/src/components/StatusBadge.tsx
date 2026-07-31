import { Badge } from '@/components/ui/badge';
import type { UserStatus } from '../types';

const MAP: Record<UserStatus, { label: string; className: string }> = {
  ATIVO: { label: 'Ativo', className: 'bg-k-success/10 text-k-success border-k-success/30' },
  SUSPENSO: { label: 'Suspenso', className: 'bg-k-warn/10 text-k-warn border-k-warn/30' },
  BLOQUEADO: { label: 'Bloqueado', className: 'bg-k-error/10 text-k-error border-k-error/30' },
};

/** Selo de estado de compliance de uma conta (ATIVO/SUSPENSO/BLOQUEADO). */
export default function StatusBadge({ status }: { status: UserStatus }) {
  const s = MAP[status];
  return (
    <Badge variant="outline" className={s.className}>
      {s.label}
    </Badge>
  );
}
