import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { toast } from 'sonner';
import { AlertCircle, Check, LogOut, MessageCircle, X } from 'lucide-react';
import { updateMyPhone } from '../services/userService';
import { isValidCellPhone, maskCellPhone } from '../utils/whatsapp';
import { EASE_OUT } from './motion/primitives';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

interface PhoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Celular atual (DDD + número) ou null se ainda não cadastrado. */
  phone: string | null;
  onSaved: (phone: string) => void;
  /**
   * Conta sem celular (anterior à obrigatoriedade): o diálogo não fecha por X, Esc
   * ou clique fora; a única saída além de salvar é sair da conta.
   */
  required?: boolean;
  onSignOut?: () => void;
}

/** Cadastro/troca do celular do próprio usuário (atalho de WhatsApp com os alunos). */
export default function PhoneDialog({
  open,
  onOpenChange,
  phone,
  onSaved,
  required = false,
  onSignOut,
}: PhoneDialogProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setValue(phone ? maskCellPhone(phone) : '');
      setError(null);
    }
  }, [open, phone]);

  const valid = isValidCellPhone(value);
  const unchanged = !!phone && value.replace(/\D/g, '') === phone;

  const handleClose = () => {
    if (required || submitting) return;
    onOpenChange(false);
  };

  // Mesmo trap de foco do InviteStudentModal: Tab circula dentro do sheet.
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      handleClose();
      return;
    }
    if (e.key !== 'Tab' || !sheetRef.current) return;

    const focusable = Array.from(sheetRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!valid) {
      setError('Informe DDD + número do celular, ex.: (11) 98765-4321.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const saved = await updateMyPhone(value);
      onSaved(saved);
      toast.success(required ? 'WhatsApp cadastrado. Bom trabalho!' : 'WhatsApp atualizado.');
      onOpenChange(false);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: unknown } }).response?.data;
      setError(typeof data === 'string' && data ? data : 'Não foi possível salvar o celular. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="phone-overlay"
          onClick={handleClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-[6px]"
        >
          <motion.div
            ref={sheetRef}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
            role="dialog"
            aria-modal="true"
            aria-labelledby="phone-dialog-title"
            tabIndex={-1}
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.45, ease: EASE_OUT }}
            className="flex w-full max-w-[460px] flex-col gap-5 rounded-[22px] border border-white/10 bg-k-surface1 p-7 shadow-[0_40px_90px_-20px_rgba(0,0,0,0.7)] outline-none"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-k-primary/[0.12] text-k-primary">
                <MessageCircle className="h-[22px] w-[22px]" />
              </span>
              {required ? (
                <span className="rounded-full border border-k-primary/30 bg-k-primary/[0.08] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-k-primary">
                  Obrigatório
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleClose}
                  aria-label="Fechar"
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-k-surface1 text-k-text-dim transition-colors hover:bg-k-surface2 hover:text-k-text"
                >
                  <X className="h-[18px] w-[18px]" />
                </button>
              )}
            </div>

            <div>
              <h2
                id="phone-dialog-title"
                className="font-display text-2xl font-extrabold tracking-tight font-stretch-semi-expanded"
              >
                {required ? 'Cadastre seu WhatsApp' : 'Meu WhatsApp'}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-k-text-dim">
                {required
                  ? 'O contato com os seus alunos agora é pelo WhatsApp. Informe seu celular para continuar usando o painel.'
                  : 'Seus alunos com vínculo ativo usam este número para falar com você pelo WhatsApp.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label htmlFor="my-phone" className="text-[13px] font-semibold text-k-text-soft">
                  Celular com DDD
                </label>
                <div className="flex h-12 w-full items-center overflow-hidden rounded-xl border border-white/10 bg-k-bg transition-[border-color,box-shadow] focus-within:border-k-primary focus-within:shadow-[0_0_0_4px_rgba(0,229,255,0.12)]">
                  <span className="flex h-full items-center border-r border-white/10 px-3.5 text-[15px] font-semibold text-k-text-muted">
                    +55
                  </span>
                  <input
                    id="my-phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    placeholder="(11) 98765-4321"
                    value={value}
                    onChange={(e) => {
                      setValue(maskCellPhone(e.target.value));
                      setError(null);
                    }}
                    autoFocus
                    required
                    aria-invalid={!!error}
                    aria-describedby={error ? 'phone-error' : required ? 'phone-hint' : undefined}
                    // Borda/fundo globais de input (theme.css) zerados: quem desenha a caixa é o wrapper.
                    className="h-full min-w-0 flex-1 rounded-none border-0 bg-transparent px-4 text-[15px] tracking-wide outline-none placeholder:text-k-text-muted focus:border-0"
                  />
                  <AnimatePresence>
                    {valid && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.6 }}
                        className="mr-3.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-k-primary/[0.15] text-k-primary"
                      >
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <AnimatePresence mode="wait">
                  {error ? (
                    <motion.p
                      key="error"
                      id="phone-error"
                      role="alert"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex gap-2 overflow-hidden text-[13px] leading-snug text-k-alert"
                    >
                      <AlertCircle className="mt-px h-4 w-4 shrink-0" />
                      <span>{error}</span>
                    </motion.p>
                  ) : required ? (
                    // No modo troca a descrição do topo já diz isso.
                    <motion.p
                      key="hint"
                      id="phone-hint"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-[12.5px] leading-snug text-k-text-muted"
                    >
                      Visível só para alunos com vínculo ativo.
                    </motion.p>
                  ) : null}
                </AnimatePresence>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2.5">
                {required ? (
                  onSignOut && (
                    <button
                      type="button"
                      onClick={onSignOut}
                      disabled={submitting}
                      className="mr-auto flex h-11 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-k-text-muted transition-colors hover:text-k-alert disabled:opacity-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Sair da conta
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={handleClose}
                    className="h-11 rounded-xl border border-white/10 bg-k-surface1 px-[18px] text-sm font-semibold text-k-text-dim transition-colors hover:bg-k-surface2 hover:text-k-text"
                  >
                    Cancelar
                  </button>
                )}
                <motion.button
                  type="submit"
                  disabled={submitting || !valid || unchanged}
                  whileTap={{ scale: 0.97 }}
                  className="flex h-11 items-center gap-2 rounded-xl bg-k-primary px-5 text-sm font-bold text-k-on-primary transition-[box-shadow,opacity] hover:shadow-[0_0_0_4px_rgba(0,229,255,0.14),0_10px_26px_-10px_rgba(0,229,255,0.8)] disabled:pointer-events-none disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  {submitting ? 'Salvando…' : required ? 'Salvar e continuar' : 'Salvar'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
