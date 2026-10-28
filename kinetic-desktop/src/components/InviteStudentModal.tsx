import { useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { AlertCircle, Link2, Mail, Send, X } from 'lucide-react';
import { createInviteCode, inviteStudent } from '../services/trainerService';
import { SPRING_PILL } from './motion/primitives';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog';
import InviteShare from './personal/InviteShare';
import { formatInviteCode, inviteUrl } from '../utils/invite';
import type { TrainerInviteCode, TrainerLink } from '../types';

type Mode = 'link' | 'email';

const MODES: { id: Mode; label: string }[] = [
  { id: 'link', label: 'Link (WhatsApp)' },
  { id: 'email', label: 'Já tem conta (e-mail)' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  /** Chamado com o vínculo PENDENTE criado pelo convite por e-mail; o modal fecha em seguida. */
  onInvited: (link: TrainerLink) => void;
  /** Chamado com o convite por link recém-gerado (o modal continua aberto mostrando o link). */
  onLinkCreated?: (invite: TrainerInviteCode) => void;
  /** Primeiro nome do personal, para assinar a mensagem do convite. */
  trainerFirstName?: string;
}

const inputClass =
  'h-12 w-full rounded-xl border border-white/10 bg-k-bg px-4 text-[15px] transition-[border-color,box-shadow] placeholder:text-k-text-muted focus:border-k-primary focus:shadow-[0_0_0_4px_rgba(0,229,255,0.12)]';

export default function InviteStudentModal({
  open,
  onClose,
  onInvited,
  onLinkCreated,
  trainerFirstName,
}: Props) {
  const [mode, setMode] = useState<Mode>('link');
  const [email, setEmail] = useState('');
  const [label, setLabel] = useState('');
  const [created, setCreated] = useState<TrainerInviteCode | null>(null);
  const [error, setError] = useState<string | null>(null);
  // 402: plano cheio ou teste encerrado — o erro ganha um atalho para "Meu plano".
  const [limitHit, setLimitHit] = useState(false);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setMode('link');
    setEmail('');
    setLabel('');
    setCreated(null);
    setError(null);
    setLimitHit(false);
  };

  const handleClose = () => {
    if (busy) return;
    reset();
    onClose();
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setLimitHit(false);
  };

  /** Plano cheio (402): mostra o texto do backend e o atalho para "Meu plano". */
  const handlePlanLimit = (res: { status?: number; data?: unknown } | undefined): boolean => {
    if (res?.status !== 402) return false;
    setError(typeof res.data === 'string' && res.data ? res.data : 'Seu plano não permite mais alunos.');
    setLimitHit(true);
    return true;
  };

  const handleCreateLink = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;

    setBusy(true);
    setError(null);
    try {
      const invite = await createInviteCode(label.trim());
      setCreated(invite);
      onLinkCreated?.(invite);
    } catch (err: unknown) {
      const res = (err as { response?: { status?: number; data?: unknown } }).response;
      if (handlePlanLimit(res)) return;
      setError(
        res?.status === 400 && typeof res.data === 'string' && res.data
          ? res.data
          : 'Não foi possível gerar o link. Tente novamente.',
      );
    } finally {
      setBusy(false);
    }
  };

  const handleInviteByEmail = async (e: FormEvent) => {
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
      const res = (err as { response?: { status?: number; data?: unknown } }).response;
      if (handlePlanLimit(res)) return;
      const status = res?.status;
      // O servidor responde igual para e-mail sem conta, conta que não é de aluno e aluno
      // que já tem personal (não revela quem usa o app); a mensagem dele já orienta.
      if (status === 400 || status === 409) {
        const data = res?.data;
        setError(
          (typeof data === 'string' && data) ||
            'Não foi possível convidar este e-mail. Se o aluno ainda não tem conta, use o convite por link.',
        );
      } else {
        setError('Não foi possível enviar o convite. Tente novamente.');
      }
    } finally {
      setBusy(false);
    }
  };

  const errorLine = (
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
          <span>
            {error}
            {limitHit && (
              <>
                {' '}
                <Link to="/assinatura" className="font-semibold underline underline-offset-2">
                  Ver planos
                </Link>
              </>
            )}
          </span>
        </motion.p>
      )}
    </AnimatePresence>
  );

  const cancelButton = (text = 'Cancelar') => (
    <button
      type="button"
      onClick={handleClose}
      className="h-11 rounded-xl border border-white/10 bg-k-surface1 px-[18px] text-sm font-semibold text-k-text-dim transition-colors hover:bg-k-surface2 hover:text-k-text"
    >
      {text}
    </button>
  );

  const submitClass =
    'flex h-11 items-center gap-2 rounded-xl bg-k-primary px-5 text-sm font-bold text-k-on-primary transition-[box-shadow,opacity] hover:shadow-[0_0_0_4px_rgba(0,229,255,0.14),0_10px_26px_-10px_rgba(0,229,255,0.8)] disabled:pointer-events-none disabled:opacity-50';

  return (
    // Radix cuida de foco, Esc e clique fora (handleClose não fecha no meio de um envio).
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent showCloseButton={false} className="flex flex-col sm:max-w-[500px]">
        <div className="flex items-start justify-between gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-k-primary/[0.12] text-k-primary">
            {mode === 'link' ? <Link2 className="h-[22px] w-[22px]" /> : <Mail className="h-[22px] w-[22px]" />}
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
          <DialogTitle className="text-2xl">{created ? 'Link de convite pronto' : 'Convidar aluno'}</DialogTitle>
          <DialogDescription className="mt-2">
            {created
              ? 'Mande para o aluno. Ao criar a conta no app e digitar o código, ele entra direto na sua carteira. O link vale 7 dias e só pode ser usado uma vez.'
              : mode === 'link'
                ? 'Gere um link para mandar pelo WhatsApp. Funciona para quem ainda não tem conta no Kinetic.'
                : 'Use o e-mail de cadastro do aluno no app Kinetic. O vínculo é ativado assim que ele aceitar o convite.'}
          </DialogDescription>
        </div>

        {!created && (
          <div
            role="tablist"
            aria-label="Forma de convite"
            className="flex gap-1 rounded-[14px] border border-k-ghost bg-k-bg p-1"
          >
            {MODES.map((m) => {
              const active = mode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => switchMode(m.id)}
                  className={`relative flex h-9 flex-1 items-center justify-center rounded-[10px] text-[13px] font-semibold transition-colors ${
                    active ? 'text-k-primary' : 'text-k-text-dim hover:text-k-text'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="invite-mode-pill"
                      transition={SPRING_PILL}
                      className="absolute inset-0 rounded-[10px] bg-k-primary-dim shadow-[inset_0_0_0_1px_rgba(0,229,255,0.25)]"
                    />
                  )}
                  <span className="relative">{m.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {created?.code ? (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-k-bg p-4">
              <span className="text-[12px] font-semibold uppercase tracking-wider text-k-text-muted">
                Código {created.label ? `· ${created.label}` : ''}
              </span>
              <span className="font-display text-[26px] font-extrabold tracking-[0.12em] text-k-primary">
                {formatInviteCode(created.code)}
              </span>
              <span className="break-all text-[13px] text-k-text-dim">{inviteUrl(created.code)}</span>
            </div>
            <InviteShare code={created.code} trainerFirstName={trainerFirstName} />
            <div className="flex justify-end">{cancelButton('Concluir')}</div>
          </div>
        ) : mode === 'link' ? (
          <form onSubmit={handleCreateLink} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="invite-label" className="text-[13px] font-semibold text-k-text-soft">
                Nome do aluno <span className="font-normal text-k-text-muted">(opcional, só para você)</span>
              </label>
              <input
                id="invite-label"
                type="text"
                placeholder="Ex.: Maria – turma da manhã"
                value={label}
                maxLength={80}
                onChange={(e) => {
                  setLabel(e.target.value);
                  setError(null);
                }}
                autoFocus
                aria-invalid={!!error}
                aria-describedby={error ? 'invite-error' : undefined}
                className={inputClass}
              />
              {errorLine}
            </div>
            <div className="flex flex-wrap justify-end gap-2.5">
              {cancelButton()}
              <motion.button type="submit" disabled={busy} whileTap={{ scale: 0.97 }} className={submitClass}>
                <Link2 className="h-4 w-4" />
                {busy ? 'Gerando…' : 'Gerar link'}
              </motion.button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleInviteByEmail} className="flex flex-col gap-5">
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
                className={inputClass}
              />
              {errorLine}
            </div>
            <div className="flex flex-wrap justify-end gap-2.5">
              {cancelButton()}
              <motion.button
                type="submit"
                disabled={busy || !email.trim()}
                whileTap={{ scale: 0.97 }}
                className={submitClass}
              >
                <Send className="h-4 w-4" />
                {busy ? 'Enviando…' : 'Enviar convite'}
              </motion.button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
