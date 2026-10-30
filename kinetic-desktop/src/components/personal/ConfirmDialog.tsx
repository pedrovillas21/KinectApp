import { useId, type ReactNode } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog';

/** Mesmo limite do backend (ReasonDTO). */
export const REASON_MIN = 10;
export const REASON_MAX = 500;

interface Props {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  /** Ação destrutiva pinta o botão de confirmação em vermelho. */
  destructive?: boolean;
  busy?: boolean;
  /**
   * Ação do ROOT que exige motivo: mostra o campo e só libera o confirmar com
   * {@link REASON_MIN}+ caracteres. O texto vai para a trilha de auditoria.
   */
  reason?: { value: string; onChange: (value: string) => void };
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
  reason,
  onConfirm,
  onCancel,
}: Props) {
  const reasonId = useId();
  const reasonTooShort = reason !== undefined && reason.value.trim().length < REASON_MIN;

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
        {reason && (
          <div className="flex flex-col gap-2">
            <label htmlFor={reasonId} className="text-[13px] font-semibold text-k-text-soft">
              Motivo <span className="font-normal text-k-text-muted">(fica registrado na auditoria)</span>
            </label>
            <textarea
              id={reasonId}
              rows={3}
              maxLength={REASON_MAX}
              value={reason.value}
              onChange={(e) => reason.onChange(e.target.value)}
              disabled={busy}
              autoFocus
              placeholder="Ex.: pedido do titular por e-mail em 30/10"
              className="w-full resize-none rounded-xl border border-white/10 bg-k-bg px-4 py-3 text-[15px] placeholder:text-k-text-muted focus:border-k-primary"
            />
            <span className="text-xs text-k-text-muted" aria-live="polite">
              {reasonTooShort
                ? `Mínimo de ${REASON_MIN} caracteres (${reason.value.trim().length}/${REASON_MIN}).`
                : `${reason.value.length}/${REASON_MAX}`}
            </span>
          </div>
        )}
        <div className="flex flex-wrap justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            // Em ação destrutiva o foco começa no "Voltar": um Enter distraído não apaga nada.
            // Com motivo, começa no campo (o confirmar fica travado até ele ser preenchido).
            autoFocus={destructive && !reason}
            className="h-11 rounded-xl border border-white/10 bg-k-surface1 px-[18px] text-sm font-semibold text-k-text-dim transition-colors hover:bg-k-surface2 hover:text-k-text disabled:opacity-50"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy || reasonTooShort}
            autoFocus={!destructive && !reason}
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
