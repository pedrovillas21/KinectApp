import type { FormEvent, ReactNode } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog';

interface Props {
  open: boolean;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  submitLabel: string;
  busy?: boolean;
  submitDisabled?: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}

/** Diálogo com formulário curto no visual do painel (par do ConfirmDialog). */
export default function FormDialog({
  open,
  title,
  description,
  children,
  submitLabel,
  busy = false,
  submitDisabled = false,
  onSubmit,
  onCancel,
}: Props) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!busy && !submitDisabled) onSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !busy && onCancel()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[460px] gap-5 rounded-[22px] border-white/10 bg-k-surface1 p-7 shadow-[0_40px_90px_-20px_rgba(0,0,0,0.7)]"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <DialogTitle className="font-display text-xl font-extrabold tracking-tight font-stretch-semi-expanded">
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription className="mt-2 text-sm leading-relaxed text-k-text-dim">
                {description}
              </DialogDescription>
            )}
          </div>
          {children}
          <div className="flex flex-wrap justify-end gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="h-11 rounded-xl border border-white/10 bg-k-surface1 px-[18px] text-sm font-semibold text-k-text-dim transition-colors hover:bg-k-surface2 hover:text-k-text disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={busy || submitDisabled}
              className="h-11 rounded-xl bg-k-primary px-5 text-sm font-bold text-k-on-primary transition-[box-shadow,opacity] hover:shadow-[0_0_0_4px_rgba(0,229,255,0.14)] disabled:pointer-events-none disabled:opacity-50"
            >
              {busy ? 'Salvando…' : submitLabel}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Classes do input no padrão do painel, para os formulários dentro do FormDialog. */
export const formInputClass =
  'h-12 w-full rounded-xl border border-white/10 bg-k-bg px-4 text-[15px] transition-[border-color,box-shadow] placeholder:text-k-text-muted focus:border-k-primary focus:shadow-[0_0_0_4px_rgba(0,229,255,0.12)]';

export const formLabelClass = 'text-[13px] font-semibold text-k-text-soft';
