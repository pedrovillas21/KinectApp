import type { ReactNode } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog';

interface Props {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  /** Ação destrutiva pinta o botão de confirmação em vermelho. */
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Confirmação curta no visual do painel (Radix cuida de foco, Esc e overlay). */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && !busy && onCancel()}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[440px] gap-5 rounded-[22px] border-white/10 bg-k-surface1 p-5 sm:p-7 shadow-[0_40px_90px_-20px_rgba(0,0,0,0.7)]"
      >
        <div>
          <DialogTitle className="font-display text-xl font-extrabold tracking-tight font-stretch-semi-expanded">
            {title}
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm leading-relaxed text-k-text-dim">
            {description}
          </DialogDescription>
        </div>
        <div className="flex flex-wrap justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            // Em ação destrutiva o foco começa no "Voltar": um Enter distraído não apaga nada.
            autoFocus={destructive}
            className="h-11 rounded-xl border border-white/10 bg-k-surface1 px-[18px] text-sm font-semibold text-k-text-dim transition-colors hover:bg-k-surface2 hover:text-k-text disabled:opacity-50"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            autoFocus={!destructive}
            className={`h-11 rounded-xl px-5 text-sm font-bold transition-[box-shadow,opacity] disabled:pointer-events-none disabled:opacity-50 ${
              destructive
                ? 'border border-k-alert/35 bg-k-alert/[0.14] text-k-alert hover:bg-k-alert/[0.22]'
                : 'bg-k-primary text-k-on-primary hover:shadow-[0_0_0_4px_rgba(0,229,255,0.14)]'
            }`}
          >
            {busy ? 'Aguarde…' : confirmLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
