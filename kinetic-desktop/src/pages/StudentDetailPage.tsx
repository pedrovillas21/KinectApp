import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { listStudents } from '../services/trainerService';
import Avatar from '../components/Avatar';
import ChatPanel from '../components/ChatPanel';
import DashboardTab from '../components/DashboardTab';
import { ArrowLeft, MessageSquare, LayoutDashboard, UserX, RefreshCw } from 'lucide-react';
import type { TrainerPeer } from '../types';

type Tab = 'dashboard' | 'chat';

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
    return (
      <div className="h-screen bg-k-bg text-k-text flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-k-primary" />
        <p className="text-sm text-k-text-muted font-medium">Carregando perfil do aluno…</p>
      </div>
    );
  }

  if (!peer || !id) {
    return (
      <div className="h-screen bg-k-bg text-k-text flex flex-col items-center justify-center p-6 text-center gap-4">
        <div className="w-14 h-14 rounded-full bg-k-surface2 flex items-center justify-center text-k-error">
          <UserX className="w-7 h-7" />
        </div>
        <div>
          <p className="font-extrabold text-base text-k-text-dim">Aluno não encontrado</p>
          <p className="text-xs text-k-text-muted mt-1 max-w-xs">
            Este aluno não foi encontrado na sua carteira de alunos ativos ou o link de acesso está incorreto.
          </p>
        </div>
        <Link
          to="/students"
          className="flex items-center gap-2 mt-2 px-4 py-2.5 bg-k-surface2 hover:bg-k-surface3 border border-k-ghost rounded-xl text-xs font-bold transition-all active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar para meus alunos</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen bg-k-bg text-k-text flex flex-col overflow-hidden">
      {/* Fixed Sticky Header */}
      <header className="border-b border-k-ghost bg-k-surface1/60 backdrop-blur-md sticky top-0 z-30 px-6 py-3.5 flex items-center gap-4 justify-between shrink-0">
        <div className="flex items-center gap-3.5 min-w-0">
          <Link
            to="/students"
            aria-label="Voltar"
            className="w-9 h-9 rounded-xl bg-k-surface2 border border-k-ghost text-k-text-dim hover:text-white hover:border-k-ghost-hi flex items-center justify-center transition-all shrink-0 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <Avatar name={peer.nome} avatarUrl={peer.avatarUrl} size={42} />
          <div className="min-w-0">
            <h1 className="font-extrabold text-sm sm:text-base leading-tight truncate">{peer.nome}</h1>
            <p className="text-xs text-k-text-muted truncate mt-0.5">{peer.email}</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex items-center bg-k-bg/80 border border-k-ghost p-1 rounded-xl shrink-0" aria-label="Seções do aluno">
          <button
            onClick={() => setTab('dashboard')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
              tab === 'dashboard'
                ? 'bg-k-primary-dim text-k-primary shadow-[inset_0_0_0_1px_rgba(0,229,255,0.15)]'
                : 'text-k-text-muted hover:text-k-text'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
          <button
            onClick={() => setTab('chat')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
              tab === 'chat'
                ? 'bg-k-primary-dim text-k-primary shadow-[inset_0_0_0_1px_rgba(0,229,255,0.15)]'
                : 'text-k-text-muted hover:text-k-text'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Chat</span>
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {tab === 'dashboard' ? (
          <DashboardTab studentId={id} studentFirstName={peer.nome.split(' ')[0]} />
        ) : (
          <ChatPanel peerId={id} peerName={peer.nome} />
        )}
      </div>
    </div>
  );
}
