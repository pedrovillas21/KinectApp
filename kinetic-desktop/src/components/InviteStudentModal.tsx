import { useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { inviteStudent } from '../services/trainerService';
import { X, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { TrainerLink } from '../types';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

interface Props {
  open: boolean;
  onClose: () => void;
  onInvited: (link: TrainerLink) => void;
}

export default function InviteStudentModal({ open, onClose, onInvited }: Props) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  const reset = () => {
    setEmail('');
    setError(null);
    setSuccess(null);
  };

  const handleClose = () => {
    if (busy) return;
    reset();
    onClose();
  };

  if (!open) return null;

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
    setSuccess(null);
    try {
      const link = await inviteStudent(target);
      onInvited(link);
      setSuccess(
        `Convite enviado para ${link.peer.nome}. Ele precisa aceitar pelo app para o vínculo valer.`,
      );
      setEmail('');
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
    <div
      onClick={handleClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
    >
      <div
        ref={sheetRef}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-student-title"
        tabIndex={-1}
        className="w-full max-w-[480px] bg-k-surface1 border border-k-ghost rounded-2xl p-6 shadow-2xl animate-scale-up outline-none"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-k-ghost/40 mb-4">
          <h2 id="invite-student-title" className="text-base font-extrabold tracking-tight">Convidar Novo Aluno</h2>
          <button
            onClick={handleClose}
            aria-label="Fechar"
            className="w-8 h-8 rounded-xl bg-k-surface2 border border-k-ghost text-k-text-muted hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <p className="text-xs text-k-text-dim leading-relaxed mb-5">
          Informe o e-mail cadastrado na conta do seu aluno no aplicativo mobile Kinetic. Ele receberá o convite na página inicial do app e, ao aceitar, o perfil dele aparecerá no seu painel.
        </p>

        {/* Invite Form */}
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 flex items-center">
            <span className="absolute left-3.5 text-k-text-muted">
              <Mail className="w-4 h-4" />
            </span>
            <input
              type="email"
              placeholder="aluno@exemplo.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
                setSuccess(null);
              }}
              autoFocus
              required
              className="w-full pl-10 pr-4 py-2.5 bg-k-surface2/60 border border-k-ghost rounded-xl outline-none focus:border-k-primary focus:ring-1 focus:ring-k-primary/30 transition-all text-xs placeholder:text-k-text-muted"
            />
          </div>
          <button
            type="submit"
            disabled={busy || !email.trim()}
            className="py-2.5 px-5 bg-k-primary hover:bg-k-primary-deep text-k-on-primary font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer whitespace-nowrap"
          >
            {busy ? 'Enviando…' : 'Enviar Convite'}
          </button>
        </form>

        {/* Success / Error Feedbacks */}
        {error && (
          <div className="flex gap-2.5 mt-4 p-3 rounded-xl bg-k-error/10 border border-k-error/30 text-k-error text-xs leading-normal">
            <AlertCircle className="w-4.5 h-4.5 shrink-0 text-k-error" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex gap-2.5 mt-4 p-3 rounded-xl bg-k-success/10 border border-k-success/30 text-k-success text-xs leading-normal">
            <CheckCircle2 className="w-4.5 h-4.5 shrink-0 text-k-success" />
            <span>{success}</span>
          </div>
        )}
      </div>
    </div>
  );
}
