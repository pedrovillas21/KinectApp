import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { toast } from 'sonner';
import { Link2, RefreshCw, Trash2 } from 'lucide-react';
import { regenerateInviteCode, revokeInviteCode } from '../../services/trainerService';
import { EASE_OUT } from '../motion/primitives';
import InviteShare from './InviteShare';
import { expiryLabel, formatInviteCode } from '../../utils/invite';
import type { TrainerInviteCode } from '../../types';

/**
 * Links de convite ainda não usados. O servidor não guarda o código em claro,
 * então só dá para reenviar o que acabou de ser gerado nesta sessão; para os
 * demais, "Novo link" troca o código (o antigo deixa de valer).
 */
export default function PendingInvites({
  invites,
  onChange,
  trainerFirstName,
}: {
  invites: TrainerInviteCode[];
  /** Substitui (convite renovado) ou remove (convite cancelado, `next` = null) um item da lista. */
  onChange: (id: string, next: TrainerInviteCode | null) => void;
  trainerFirstName?: string;
}) {
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  if (invites.length === 0) return null;

  const run = async (id: string, action: () => Promise<void>) => {
    if (busy[id]) return;
    setBusy((b) => ({ ...b, [id]: true }));
    try {
      await action();
    } finally {
      setBusy((b) => {
        const next = { ...b };
        delete next[id];
        return next;
      });
    }
  };

  const handleRegenerate = (invite: TrainerInviteCode) =>
    run(invite.id, async () => {
      try {
        onChange(invite.id, await regenerateInviteCode(invite.id));
        toast.success('Novo link gerado', { description: 'O link anterior deixou de funcionar.' });
      } catch {
        toast.error('Não foi possível gerar um novo link.');
      }
    });

  const handleRevoke = (invite: TrainerInviteCode) =>
    run(invite.id, async () => {
      try {
        await revokeInviteCode(invite.id);
        onChange(invite.id, null);
        toast.success('Convite cancelado');
      } catch {
        toast.error('Não foi possível cancelar o convite.');
      }
    });

  return (
    <section aria-label="Convites pendentes" className="flex flex-col gap-3">
      <div className="flex items-baseline gap-2.5">
        <h3 className="font-display text-lg font-extrabold tracking-tight font-stretch-semi-expanded">
          Convites por link aguardando o aluno
        </h3>
        <span className="text-[13px] text-k-text-muted">{invites.length}</span>
      </div>

      <ul className="flex flex-col gap-2.5">
        <AnimatePresence initial={false}>
          {invites.map((invite) => {
            const isBusy = !!busy[invite.id];
            return (
              <motion.li
                key={invite.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.35, ease: EASE_OUT }}
                className="flex flex-col gap-3 rounded-[16px] border border-k-ghost bg-k-surface1 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-k-primary-dim text-k-primary">
                      <Link2 className="h-[18px] w-[18px]" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{invite.label ?? 'Convite sem nome'}</p>
                      <p className={`text-[12.5px] ${invite.expired ? 'text-k-alert' : 'text-k-text-muted'}`}>
                        {invite.code ? `Código ${formatInviteCode(invite.code)} · ` : ''}
                        {invite.expired ? 'Vencido' : expiryLabel(invite.expiresAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => void handleRegenerate(invite)}
                      className="flex h-9 items-center gap-1.5 rounded-xl border border-white/10 px-3 text-[13px] font-semibold text-k-text-dim transition-colors hover:bg-k-surface2 hover:text-k-text disabled:opacity-50"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Novo link
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => void handleRevoke(invite)}
                      aria-label={`Cancelar convite ${invite.label ?? ''}`.trim()}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-k-text-dim transition-colors hover:border-k-alert/40 hover:text-k-alert disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {invite.code && !invite.expired && (
                  <InviteShare code={invite.code} trainerFirstName={trainerFirstName} compact />
                )}
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </section>
  );
}
