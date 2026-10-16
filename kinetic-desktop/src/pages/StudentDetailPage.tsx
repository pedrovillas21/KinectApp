import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { toast } from 'sonner';
import { ArrowLeft, BarChart3, Dumbbell, MessageCircle, Target, UserMinus, UserX } from 'lucide-react';
import { endStudentLink, listStudents } from '../services/trainerService';
import { useAuth } from '../contexts/AuthContext';
import Avatar from '../components/Avatar';
import DashboardTab from '../components/DashboardTab';
import WorkoutPlansTab from '../components/personal/WorkoutPlansTab';
import ConfirmDialog from '../components/personal/ConfirmDialog';
import { EASE_OUT, SPRING_PILL } from '../components/motion/primitives';
import type { TrainerLink } from '../types';
import { whatsappUrl } from '../utils/whatsapp';

type TabId = 'dashboard' | 'plans';

const TABS: { id: TabId; label: string; icon: typeof BarChart3 }[] = [
  { id: 'dashboard', label: 'Desempenho', icon: BarChart3 },
  { id: 'plans', label: 'Treinos', icon: Dumbbell },
];

const sinceLabel = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
};

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  // A aba fica na URL (?aba=treinos): sobrevive a recarregar e ao voltar do navegador.
  const [searchParams, setSearchParams] = useSearchParams();
  const tab: TabId = searchParams.get('aba') === 'treinos' ? 'plans' : 'dashboard';
  // Aba visitada continua montada (só oculta): trocar de aba não perde um
  // rascunho de ficha em edição nem refaz as buscas do desempenho.
  const [visited, setVisited] = useState<Set<TabId>>(() => new Set([tab]));

  const [link, setLink] = useState<TrainerLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [goal, setGoal] = useState<string | null>(null);
  const [endOpen, setEndOpen] = useState(false);
  const [ending, setEnding] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLink(null);
    setGoal(null);
    listStudents()
      .then((links) => {
        if (cancelled) return;
        setLink(links.find((l) => l.peer.id === id) ?? null);
      })
      .catch(() => {
        if (!cancelled) setLink(null);
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
      <div className="flex h-screen flex-col bg-k-bg text-k-text" role="status" aria-label="Carregando perfil do aluno">
        <div className="flex items-center gap-3.5 border-b border-k-ghost px-8 py-3.5">
          <div className="k-skeleton h-11 w-11 rounded-xl bg-k-surface1" />
          <div className="k-skeleton h-12 w-12 rounded-full bg-k-surface2" />
          <div className="flex flex-col gap-2">
            <div className="k-skeleton h-4 w-44 rounded-full bg-k-surface2" />
            <div className="k-skeleton h-3 w-64 rounded-full bg-k-surface1" />
          </div>
        </div>
      </div>
    );
  }

  if (!link || !id) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-k-bg p-6 text-center text-k-text">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
          className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-k-alert/[0.12] text-k-alert"
        >
          <UserX className="h-7 w-7" />
        </motion.div>
        <div>
          <p className="font-display text-xl font-extrabold font-stretch-semi-expanded">
            Aluno não encontrado
          </p>
          <p className="mt-1.5 max-w-xs text-sm text-k-text-dim">
            Este aluno não está na sua carteira de alunos ativos ou o link está incorreto.
          </p>
        </div>
        <Link
          to="/students"
          className="mt-2 flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-k-surface1 px-4 text-sm font-semibold transition-colors hover:bg-k-surface2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para meus alunos
        </Link>
      </div>
    );
  }

  const peer = link.peer;
  const firstName = peer.nome.trim().split(/\s+/)[0] ?? peer.nome;
  const trainerFirstName = currentUser?.nome.trim().split(/\s+/)[0];
  const whatsappHref = peer.phone
    ? whatsappUrl(peer.phone, `Oi, ${firstName}!${trainerFirstName ? ` Aqui é ${trainerFirstName}, seu personal.` : ''}`)
    : null;

  // Vínculo atribuído pela empresa só a empresa encerra (o backend também barra).
  const companyManaged = link.source === 'COMPANY';

  const handleEndLink = async () => {
    setEnding(true);
    try {
      await endStudentLink(id);
      toast.success(`${firstName} saiu da sua carteira`, {
        description: 'O histórico de treinos dele continua salvo no app.',
      });
      navigate('/students', { replace: true });
    } catch (err: unknown) {
      const res = (err as { response?: { status?: number; data?: unknown } }).response;
      toast.error(
        res?.status === 400 && typeof res.data === 'string' && res.data
          ? res.data
          : 'Não foi possível encerrar o vínculo. Tente novamente.',
      );
      setEnding(false);
      setEndOpen(false);
    }
  };

  const selectTab = (next: TabId) => {
    setVisited((v) => (v.has(next) ? v : new Set(v).add(next)));
    setSearchParams(next === 'plans' ? { aba: 'treinos' } : {}, { replace: true });
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-k-bg text-k-text">
      <header className="z-30 flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-k-ghost bg-k-bg/85 px-8 py-3.5 backdrop-blur-[14px]">
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
          className="flex min-w-0 items-center gap-3.5"
        >
          <Link
            to="/students"
            aria-label="Voltar para alunos"
            className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-k-surface1 text-k-text-dim transition-colors hover:bg-k-surface2 hover:text-k-text"
          >
            <ArrowLeft className="h-[18px] w-[18px] transition-transform duration-300 group-hover:-translate-x-0.5" />
          </Link>
          <Avatar name={peer.nome} avatarUrl={peer.avatarUrl} size={48} ring="rgba(0,229,255,0.5)" />
          <div className="min-w-0">
            <h1 className="truncate font-display text-xl font-extrabold tracking-tight font-stretch-semi-expanded">
              {peer.nome}
            </h1>
            <p className="truncate text-[12.5px] text-k-text-muted">
              {peer.email} · Vinculado desde {sinceLabel(link.respondedAt ?? link.createdAt)}
            </p>
          </div>
          <div className="ml-1.5 hidden gap-2 lg:flex">
            <AnimatePresence>
              {goal && (
                <motion.span
                  key="goal"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                  className="inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-full bg-k-primary-dim px-3 text-[12.5px] font-semibold text-k-primary"
                >
                  <Target className="h-3.5 w-3.5" />
                  Meta: {goal}
                </motion.span>
              )}
            </AnimatePresence>
            <span className="inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-full bg-k-success/10 px-3 text-[12.5px] font-semibold text-k-success">
              <span className="h-[7px] w-[7px] rounded-full bg-k-success" />
              Vínculo ativo
            </span>
          </div>
        </motion.div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div
            role="tablist"
            aria-label="Seções do aluno"
            className="flex rounded-[14px] border border-k-ghost bg-k-surface1 p-1"
          >
            {TABS.map((t) => {
              const active = t.id === tab;
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  id={`student-tab-${t.id}`}
                  aria-selected={active}
                  aria-controls={`student-panel-${t.id}`}
                  onClick={() => selectTab(t.id)}
                  className={`relative flex h-[36px] items-center gap-2 rounded-[10px] px-3.5 text-[13px] font-semibold transition-colors ${
                    active ? 'text-k-primary' : 'text-k-text-muted hover:text-k-text'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="student-tab-pill"
                      transition={SPRING_PILL}
                      className="absolute inset-0 rounded-[10px] bg-k-primary/[0.12] shadow-[inset_0_0_0_1px_rgba(0,229,255,0.28)]"
                    />
                  )}
                  <Icon className="relative h-4 w-4" />
                  <span className="relative">{t.label}</span>
                </button>
              );
            })}
          </div>

          {whatsappHref ? (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 items-center gap-2 rounded-xl border border-k-success/30 bg-k-success/10 px-4 text-sm font-semibold text-k-success transition-colors hover:bg-k-success/[0.18] active:scale-[0.97]"
            >
              <MessageCircle className="h-[17px] w-[17px]" />
              Chamar no WhatsApp
            </a>
          ) : (
            <span
              title="O aluno não tem celular cadastrado."
              className="flex h-11 cursor-not-allowed items-center gap-2 rounded-xl border border-white/10 bg-k-surface1 px-4 text-sm font-semibold text-k-text-muted opacity-60"
            >
              <MessageCircle className="h-[17px] w-[17px]" />
              Sem WhatsApp
            </span>
          )}

          <button
            type="button"
            onClick={() => setEndOpen(true)}
            disabled={companyManaged}
            aria-label="Encerrar vínculo com o aluno"
            title={
              companyManaged
                ? 'Aluno atribuído pela sua empresa: só a empresa pode desvincular.'
                : 'Encerrar vínculo com o aluno'
            }
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-k-surface1 text-k-text-dim transition-colors hover:border-k-alert/40 hover:bg-k-alert/10 hover:text-k-alert disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-white/10 disabled:hover:bg-k-surface1 disabled:hover:text-k-text-dim"
          >
            <UserMinus className="h-[18px] w-[18px]" />
          </button>
        </div>
      </header>

      <ConfirmDialog
        open={endOpen}
        title={`Encerrar vínculo com ${firstName}?`}
        description={
          <>
            {peer.nome} sai da sua carteira e você deixa de ver os treinos e o desempenho dele. As fichas
            que você montou continuam no app do aluno, que passa a poder editá-las. Para voltar a acompanhá-lo,
            será preciso enviar um novo convite.
          </>
        }
        confirmLabel={ending ? 'Encerrando…' : 'Encerrar vínculo'}
        destructive
        busy={ending}
        onConfirm={() => void handleEndLink()}
        onCancel={() => setEndOpen(false)}
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        {visited.has('dashboard') && (
          <div
            role="tabpanel"
            id="student-panel-dashboard"
            aria-labelledby="student-tab-dashboard"
            hidden={tab !== 'dashboard'}
          >
            <DashboardTab studentId={id} studentFirstName={firstName} onGoal={setGoal} />
          </div>
        )}
        {visited.has('plans') && (
          <div
            role="tabpanel"
            id="student-panel-plans"
            aria-labelledby="student-tab-plans"
            hidden={tab !== 'plans'}
          >
            <WorkoutPlansTab studentId={id} studentFirstName={firstName} studentName={peer.nome} />
          </div>
        )}
      </div>
    </div>
  );
}
