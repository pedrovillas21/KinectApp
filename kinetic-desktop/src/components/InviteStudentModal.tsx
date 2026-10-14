import { useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, Mail, Send, X } from 'lucide-react';
import { inviteStudent } from '../services/trainerService';
import { EASE_OUT } from './motion/primitives';
import type { TrainerLink } from '../types';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Chamado com o vínculo PENDENTE criado; o modal fecha em seguida. */
  onInvited: (link: TrainerLink) => void;
}

export default function InviteStudentModal({ open, onClose, onInvited }: Props) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  const reset = () => {
    setEmail('');
    setError(null);
  };

  const handleClose = () => {
    if (busy) return;
    reset();
    onClose();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      handleClose();
      return;
    }
    if (e.key !== 'Tab' || !sheetRef.current) return;

    const focusable = Array.from(
      sheetRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    );
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
    const target = email.trim();
    if (!target || busy) return;

    setBusy(true);
    setError(null);
    try {
      const link = await inviteStudent(target);
      reset();
      onInvited(link);
      onClose();
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 404) {
        setError('Nenhum aluno cadastrado com este e-mail. Peça para ele criar a conta no app primeiro.');
      } else if (status === 409) {
        setError('Este aluno já possui um personal ativo ou um convite pendente.');
      } else if (status === 400) {
        const data = (err as { response?: { data?: { message?: string } } }).response?.data;
        setError(data?.message ?? 'E-mail inválido.');
      } else {
        setError('Não foi possível enviar o convite. Tente novamente.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="invite-overlay"
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
            aria-labelledby="invite-student-title"
            tabIndex={-1}
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.45, ease: EASE_OUT }}
            className="flex w-full max-w-[460px] flex-col gap-5 rounded-[22px] border border-white/10 bg-k-surface1 p-7 shadow-[0_40px_90px_-20px_rgba(0,0,0,0.7)] outline-none"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-k-primary/[0.12] text-k-primary">
                <Mail className="h-[22px] w-[22px]" />
              </span>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Fechar"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-k-surface1 text-k-text-dim transition-colors hover:bg-k-surface2 hover:text-k-text"
              >
                <X className="h-[18px] w-[18px]" />
              </button>
            </div>

            <div>
              <h2
                id="invite-student-title"
                className="font-display text-2xl font-extrabold tracking-tight font-stretch-semi-expanded"
              >
                Convidar aluno
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-k-text-dim">
                Use o e-mail de cadastro do aluno no app Kinetic. O vínculo é ativado assim que ele
                aceitar o convite.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label htmlFor="invite-email" className="text-[13px] font-semibold text-k-text-soft">
                  E-mail do aluno
                </label>
                <input
                  id="invite-email"
                  type="email"
                  placeholder="aluno@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  autoFocus
                  required
                  aria-invalid={!!error}
                  aria-describedby={error ? 'invite-error' : undefined}
                  className="h-12 w-full rounded-xl border border-white/10 bg-k-bg px-4 text-[15px] transition-[border-color,box-shadow] placeholder:text-k-text-muted focus:border-k-primary focus:shadow-[0_0_0_4px_rgba(0,229,255,0.12)]"
                />
                <AnimatePresence>
                  {error && (
                    <motion.p
                      id="invite-error"
                      role="alert"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex gap-2 overflow-hidden text-[13px] leading-snug text-k-alert"
                    >
                      <AlertCircle className="mt-px h-4 w-4 shrink-0" />
                      <span>{error}</span>
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex flex-wrap justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleClose}
                  className="h-11 rounded-xl border border-white/10 bg-k-surface1 px-[18px] text-sm font-semibold text-k-text-dim transition-colors hover:bg-k-surface2 hover:text-k-text"
                >
                  Cancelar
                </button>
                <motion.button
                  type="submit"
                  disabled={busy || !email.trim()}
                  whileTap={{ scale: 0.97 }}
                  className="flex h-11 items-center gap-2 rounded-xl bg-k-primary px-5 text-sm font-bold text-k-on-primary transition-[box-shadow,opacity] hover:shadow-[0_0_0_4px_rgba(0,229,255,0.14),0_10px_26px_-10px_rgba(0,229,255,0.8)] disabled:pointer-events-none disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  {busy ? 'Enviando…' : 'Enviar convite'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
