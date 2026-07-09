import { useEffect, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { listStudents } from '../services/trainerService';
import Avatar from '../components/Avatar';
import InviteStudentModal from '../components/InviteStudentModal';
import { KINETIC } from '../theme/kinetic';
import type { TrainerLink } from '../types';

/** Carteira de alunos do personal: lista vínculos ATIVOS + convite por e-mail. */
export default function StudentsListPage() {
  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();

  const [students, setStudents] = useState<TrainerLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  // Feedback pós-convite: o vínculo fica PENDENTE até o aluno aceitar,
  // então não entra na lista — mostramos um aviso efêmero.
  const [pendingNote, setPendingNote] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setStudents(await listStudents());
    } catch {
      setLoadError('Não foi possível carregar seus alunos. Verifique a conexão e tente de novo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div style={st.shell}>
      <header style={st.header}>
        <div style={st.brandRow}>
          <span style={st.brandMark}>K</span>
          <div>
            <h1 style={st.brandTitle}>Kinetic — Painel do Personal</h1>
            <p style={st.brandSub}>{currentUser?.nome}</p>
          </div>
        </div>
        <div style={st.headerActions}>
          <button style={st.inviteBtn} onClick={() => setInviteOpen(true)}>
            + Convidar aluno
          </button>
          <button style={st.signOutBtn} onClick={() => void signOut()}>
            Sair
          </button>
        </div>
      </header>

      <main style={st.main}>
        <div style={st.listHeader}>
          <h2 style={st.listTitle}>Meus alunos</h2>
          <span style={st.listCount}>
            {loading ? '—' : `${students.length} ativo${students.length === 1 ? '' : 's'}`}
          </span>
        </div>

        {pendingNote && (
          <div style={st.noteBox}>
            {pendingNote}
            <button style={st.noteDismiss} onClick={() => setPendingNote(null)}>
              ✕
            </button>
          </div>
        )}

        <div style={st.listScroll}>
          {loading ? (
            <p style={st.muted}>Carregando alunos…</p>
          ) : loadError ? (
            <div style={st.errorWrap}>
              <p style={st.muted}>{loadError}</p>
              <button style={st.retryBtn} onClick={() => void load()}>
                Tentar novamente
              </button>
            </div>
          ) : students.length === 0 ? (
            <div style={st.emptyWrap}>
              <p style={st.emptyTitle}>Nenhum aluno vinculado ainda</p>
              <p style={st.muted}>
                Convide um aluno pelo e-mail — quando ele aceitar pelo app, aparece aqui.
              </p>
            </div>
          ) : (
            students.map((link) => (
              <button
                key={link.id}
                style={st.row}
                onClick={() => navigate(`/students/${link.peer.id}`)}
              >
                <Avatar name={link.peer.nome} avatarUrl={link.peer.avatarUrl} size={44} />
                <div style={st.rowInfo}>
                  <span style={st.rowName}>{link.peer.nome}</span>
                  <span style={st.rowEmail}>{link.peer.email}</span>
                </div>
                <span style={st.rowChevron}>›</span>
              </button>
            ))
          )}
        </div>
      </main>

      <InviteStudentModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvited={(link) =>
          setPendingNote(
            `Convite para ${link.peer.nome} pendente — ele entra na lista quando aceitar pelo app.`,
          )
        }
      />
    </div>
  );
}

const st: Record<string, CSSProperties> = {
  shell: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 28px',
    borderBottom: `1px solid ${KINETIC.ghost}`,
    background: KINETIC.surface1,
  },
  brandRow: { display: 'flex', alignItems: 'center', gap: 12 },
  brandMark: {
    width: 38,
    height: 38,
    borderRadius: 11,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: KINETIC.primary,
    color: '#001a1f',
    fontWeight: 900,
    fontSize: 19,
  },
  brandTitle: { fontSize: 15.5, fontWeight: 800, letterSpacing: -0.3 },
  brandSub: { fontSize: 12, color: KINETIC.textMuted, marginTop: 1 },
  headerActions: { display: 'flex', gap: 10 },
  inviteBtn: {
    padding: '9px 16px',
    borderRadius: 11,
    background: KINETIC.primary,
    color: '#001a1f',
    fontWeight: 800,
    fontSize: 13.5,
  },
  signOutBtn: {
    padding: '9px 16px',
    borderRadius: 11,
    background: KINETIC.surface2,
    color: KINETIC.textDim,
    fontWeight: 600,
    fontSize: 13.5,
  },
  main: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    maxWidth: 860,
    margin: '0 auto',
    padding: '24px 28px 0',
  },
  listHeader: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  listTitle: { fontSize: 20, fontWeight: 800, letterSpacing: -0.4 },
  listCount: { fontSize: 12.5, color: KINETIC.textMuted },
  noteBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '10px 14px',
    marginBottom: 12,
    borderRadius: 12,
    background: KINETIC.primaryDim,
    border: `1px solid ${KINETIC.primarySoft}`,
    color: KINETIC.primary,
    fontSize: 13,
  },
  noteDismiss: { color: KINETIC.primary, fontSize: 13, opacity: 0.7 },
  listScroll: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    paddingBottom: 24,
  },
  row: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '14px 16px',
    marginBottom: 8,
    borderRadius: 14,
    background: KINETIC.surface1,
    border: `1px solid ${KINETIC.ghost}`,
    textAlign: 'left',
    transition: 'border-color 0.15s ease',
  },
  rowInfo: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 },
  rowName: {
    fontSize: 15,
    fontWeight: 700,
    color: KINETIC.text,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  rowEmail: {
    fontSize: 12.5,
    color: KINETIC.textMuted,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  rowChevron: { color: KINETIC.textMuted, fontSize: 20 },
  emptyWrap: {
    padding: '56px 24px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  emptyTitle: { fontSize: 15.5, fontWeight: 700, color: KINETIC.textDim },
  muted: { color: KINETIC.textMuted, fontSize: 13, lineHeight: 1.5 },
  errorWrap: {
    padding: '48px 24px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 14,
  },
  retryBtn: {
    padding: '9px 18px',
    borderRadius: 11,
    background: KINETIC.surface2,
    color: KINETIC.text,
    fontWeight: 600,
    fontSize: 13,
  },
};
