import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { listStudents } from '../services/trainerService';
import Avatar from '../components/Avatar';
import InviteStudentModal from '../components/InviteStudentModal';
import { LogOut, UserPlus, Users, ChevronRight, RefreshCw, AlertCircle, Inbox, Activity } from 'lucide-react';
import type { TrainerLink } from '../types';

export default function StudentsListPage() {
  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();

  const [students, setStudents] = useState<TrainerLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
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
    <div className="h-screen bg-k-bg text-k-text flex flex-col overflow-hidden">
      {/* Premium Header */}
      <header className="border-b border-k-ghost bg-k-surface1/60 backdrop-blur-md sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-k-primary to-k-primary-deep text-k-on-primary shadow-[0_0_12px_rgba(0,229,255,0.25)]">
            <Activity className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight">Kinetic</h1>
            <p className="text-xs text-k-text-muted">Painel do Personal</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold leading-tight">{currentUser?.nome}</p>
            <p className="text-xs text-k-text-muted">Personal Trainer</p>
          </div>

          <div className="h-6 w-[1px] bg-k-ghost hidden sm:block" />

          <button
            onClick={() => setInviteOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-k-primary hover:bg-k-primary-deep text-k-on-primary font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Convidar aluno</span>
          </button>

          <button
            onClick={() => void signOut()}
            aria-label="Sair"
            className="flex items-center justify-center p-2.5 rounded-xl bg-k-surface2 border border-k-ghost text-k-text-dim hover:text-k-error hover:border-k-error/30 transition-all active:scale-95 cursor-pointer"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 min-h-0 overflow-y-auto px-6 py-8 max-w-5xl w-full mx-auto flex flex-col gap-6">
        {/* Welcome Section / Header Info */}
        <div className="flex items-center justify-between pb-2 border-b border-k-ghost/40">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-k-primary" />
            <h2 className="text-lg font-extrabold tracking-tight">Alunos Vinculados</h2>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-k-surface2 border border-k-ghost font-semibold text-k-text-dim">
            {loading ? '—' : `${students.length} ativo${students.length === 1 ? '' : 's'}`}
          </span>
        </div>

        {/* Temporary pending alert */}
        {pendingNote && (
          <div className="flex items-start justify-between gap-3 px-4 py-3.5 rounded-xl bg-k-primary-dim border border-k-primary-soft text-k-primary text-sm animate-fade-in">
            <div className="flex gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="leading-normal">{pendingNote}</p>
            </div>
            <button
              onClick={() => setPendingNote(null)}
              className="text-k-primary hover:text-white transition-colors text-xs font-bold px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Students list/grid */}
        <div className="flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-k-text-muted">
              <RefreshCw className="w-8 h-8 animate-spin text-k-primary" />
              <p className="text-sm">Buscando alunos da carteira...</p>
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-k-surface1 border border-k-ghost rounded-2xl gap-4">
              <AlertCircle className="w-10 h-10 text-k-error" />
              <div>
                <p className="font-bold text-sm text-k-text">{loadError}</p>
                <p className="text-xs text-k-text-muted mt-1">Verifique sua conexão de rede ou tente recarregar.</p>
              </div>
              <button
                onClick={() => void load()}
                className="flex items-center gap-2 px-4 py-2 bg-k-surface2 hover:bg-k-surface3 border border-k-ghost rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tentar novamente</span>
              </button>
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-24 px-6 bg-k-surface1/40 border border-dashed border-k-ghost rounded-2xl gap-4">
              <div className="w-14 h-14 rounded-full bg-k-surface2 flex items-center justify-center text-k-text-muted">
                <Inbox className="w-7 h-7" />
              </div>
              <div className="max-w-sm">
                <p className="font-bold text-base text-k-text-dim">Nenhum aluno vinculado ainda</p>
                <p className="text-xs text-k-text-muted mt-2 leading-relaxed">
                  Envie um convite usando o e-mail de cadastro do seu aluno. Assim que ele aceitar o convite no aplicativo mobile, o perfil dele ficará disponível aqui.
                </p>
              </div>
              <button
                onClick={() => setInviteOpen(true)}
                className="flex items-center gap-2 mt-2 px-4.5 py-2.5 bg-k-primary hover:bg-k-primary-deep text-k-on-primary font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Enviar primeiro convite</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {students.map((link) => (
                <div
                  key={link.id}
                  onClick={() => navigate(`/students/${link.peer.id}`)}
                  className="group flex items-center gap-4 p-4 bg-k-surface1/60 hover:bg-k-surface1 border border-k-ghost hover:border-k-primary/45 rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,229,255,0.06)]"
                >
                  <Avatar name={link.peer.nome} avatarUrl={link.peer.avatarUrl} size={48} />
                  <div className="flex-1 min-w-0 flex flex-col">
                    <span className="font-bold text-sm group-hover:text-k-primary transition-colors truncate">
                      {link.peer.nome}
                    </span>
                    <span className="text-xs text-k-text-muted truncate mt-0.5">
                      {link.peer.email}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-k-surface2/60 group-hover:bg-k-primary/10 flex items-center justify-center text-k-text-muted group-hover:text-k-primary transition-all">
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <InviteStudentModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvited={(link) =>
          setPendingNote(
            `Convite enviado com sucesso para ${link.peer.nome}! O vínculo está pendente e será ativado assim que ele aceitar o convite no aplicativo mobile.`,
          )
        }
      />
    </div>
  );
}
