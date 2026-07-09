import { useEffect, useState, type CSSProperties } from 'react';
import { Link, useParams } from 'react-router-dom';
import { listStudents } from '../services/trainerService';
import Avatar from '../components/Avatar';
import ChatPanel from '../components/ChatPanel';
import DashboardTab from '../components/DashboardTab';
import { KINETIC } from '../theme/kinetic';
import type { TrainerPeer } from '../types';

type Tab = 'dashboard' | 'chat';

/**
 * Detalhe do aluno: cabeçalho fixo com o peer + abas Dashboard/Chat.
 * O peer é resolvido pela carteira (listStudents) para sobreviver a refresh —
 * se o id não está na carteira, o aluno não é deste personal (mesma regra de
 * posse dos endpoints).
 */
export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [peer, setPeer] = useState<TrainerPeer | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('dashboard');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setPeer(null);
    listStudents()
      .then((links) => {
        if (cancelled) return;
        setPeer(links.find((l) => l.peer.id === id)?.peer ?? null);
      })
      .catch(() => {
        if (!cancelled) setPeer(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <div style={st.centered}>Carregando aluno…</div>;
  }

  if (!peer || !id) {
    return (
      <div style={st.centered}>
        <p style={{ color: KINETIC.textDim, marginBottom: 12 }}>
          Aluno não encontrado na sua carteira.
        </p>
        <Link to="/students" style={st.backLink}>
          ← Voltar para meus alunos
        </Link>
      </div>
    );
  }

  return (
    <div style={st.shell}>
      {/* Cabeçalho fixo (sticky por construção: fora da área rolável) */}
      <header style={st.header}>
        <Link to="/students" style={st.backBtn} aria-label="Voltar">
          ←
        </Link>
        <Avatar name={peer.nome} avatarUrl={peer.avatarUrl} size={42} />
        <div style={st.headerInfo}>
          <h1 style={st.headerName}>{peer.nome}</h1>
          <p style={st.headerEmail}>{peer.email}</p>
        </div>
        <nav style={st.tabs} aria-label="Seções do aluno">
          <button
            style={{ ...st.tabBtn, ...(tab === 'dashboard' ? st.tabBtnActive : {}) }}
            onClick={() => setTab('dashboard')}
          >
            Dashboard
          </button>
          <button
            style={{ ...st.tabBtn, ...(tab === 'chat' ? st.tabBtnActive : {}) }}
            onClick={() => setTab('chat')}
          >
            Chat
          </button>
        </nav>
      </header>

      <div style={st.content}>
        {tab === 'dashboard' ? (
          <DashboardTab studentId={id} studentFirstName={peer.nome.split(' ')[0]} />
        ) : (
          <ChatPanel peerId={id} peerName={peer.nome} />
        )}
      </div>
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
  centered: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: KINETIC.textMuted,
  },
  backLink: { fontSize: 13.5, fontWeight: 600 },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '14px 24px',
    borderBottom: `1px solid ${KINETIC.ghost}`,
    background: KINETIC.surface1,
    flexShrink: 0,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: KINETIC.surface2,
    color: KINETIC.text,
    fontSize: 17,
  },
  headerInfo: { flex: 1, minWidth: 0 },
  headerName: {
    fontSize: 16.5,
    fontWeight: 800,
    letterSpacing: -0.3,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  headerEmail: {
    fontSize: 12,
    color: KINETIC.textMuted,
    marginTop: 1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  tabs: {
    display: 'flex',
    gap: 6,
    background: KINETIC.bg,
    padding: 4,
    borderRadius: 12,
  },
  tabBtn: {
    padding: '8px 18px',
    borderRadius: 9,
    fontSize: 13.5,
    fontWeight: 700,
    color: KINETIC.textMuted,
  },
  tabBtnActive: {
    background: KINETIC.primaryDim,
    color: KINETIC.primary,
    boxShadow: `inset 0 0 0 1px ${KINETIC.primarySoft}`,
  },
  content: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
};
