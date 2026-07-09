import { useState, type CSSProperties, type FormEvent } from 'react';
import { inviteStudent } from '../services/trainerService';
import { KINETIC } from '../theme/kinetic';
import type { TrainerLink } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Chamado após o convite ser criado com sucesso (para feedback na lista). */
  onInvited: (link: TrainerLink) => void;
}

/**
 * Convite de aluno por e-mail (porta a lógica do fluxo de convite do mobile):
 * guard de duplo-clique + tratamento dos erros esperados do backend
 * (404 = aluno não cadastrado, 409 = já tem personal ativo/convite pendente).
 */
export default function InviteStudentModal({ open, onClose, onInvited }: Props) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

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
    <div style={st.overlay} onClick={handleClose}>
      <div style={st.sheet} onClick={(e) => e.stopPropagation()}>
        <div style={st.header}>
          <h2 style={st.title}>Convidar aluno</h2>
          <button style={st.closeBtn} onClick={handleClose} aria-label="Fechar">
            ✕
          </button>
        </div>

        <p style={st.hint}>
          Informe o e-mail da conta do aluno no app Kinetic. Ele receberá o
          convite e precisa aceitá-lo para entrar na sua carteira.
        </p>

        <form onSubmit={handleSubmit} style={st.form}>
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
            style={{ flex: 1 }}
          />
          <button
            type="submit"
            style={{ ...st.sendBtn, opacity: busy || !email.trim() ? 0.5 : 1 }}
            disabled={busy || !email.trim()}
          >
            {busy ? 'Enviando…' : 'Convidar'}
          </button>
        </form>

        {error && (
          <div style={st.errorBox} role="alert">
            {error}
          </div>
        )}
        {success && <div style={st.successBox}>{success}</div>}
      </div>
    </div>
  );
}

const st: Record<string, CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  sheet: {
    width: 460,
    maxWidth: 'calc(100vw - 48px)',
    background: KINETIC.surface1,
    border: `1px solid ${KINETIC.ghost}`,
    borderRadius: 20,
    padding: 24,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: { fontSize: 18, fontWeight: 800 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    background: KINETIC.surface2,
    color: KINETIC.textMuted,
    fontSize: 14,
  },
  hint: { fontSize: 12.5, color: KINETIC.textDim, marginBottom: 16, lineHeight: 1.5 },
  form: { display: 'flex', gap: 10 },
  sendBtn: {
    padding: '0 18px',
    borderRadius: 12,
    background: KINETIC.primary,
    color: '#001a1f',
    fontWeight: 800,
  },
  errorBox: {
    marginTop: 12,
    padding: '10px 12px',
    borderRadius: 10,
    background: 'rgba(255,68,68,0.10)',
    border: '1px solid rgba(255,68,68,0.35)',
    color: '#ff8a8a',
    fontSize: 13,
    lineHeight: 1.4,
  },
  successBox: {
    marginTop: 12,
    padding: '10px 12px',
    borderRadius: 10,
    background: 'rgba(74,222,128,0.10)',
    border: '1px solid rgba(74,222,128,0.35)',
    color: KINETIC.success,
    fontSize: 13,
    lineHeight: 1.4,
  },
};
