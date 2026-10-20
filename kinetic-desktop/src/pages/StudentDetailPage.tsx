import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { ArrowLeft, BarChart3, Dumbbell, MessageCircle, Ruler, UserMinus, UserX } from 'lucide-react';
import { endStudentLink, getEngagement, getStudentPlanEvolution, listStudents } from '../services/trainerService';
import { qk, refreshTrainerData } from '../services/queryClient';
import { useAuth } from '../contexts/AuthContext';
import Avatar from '../components/Avatar';
import DashboardTab from '../components/DashboardTab';
import WorkoutPlansTab from '../components/personal/WorkoutPlansTab';
import AssessmentsTab from '../components/personal/AssessmentsTab';
import ConfirmDialog from '../components/personal/ConfirmDialog';
import { ProtocolSummary, goalLabel, useStudentProtocol } from '../components/personal/StudentProtocol';
import { EASE_OUT } from '../components/motion/primitives';
import { whatsappUrl } from '../utils/whatsapp';
import type { StudentEngagement } from '../types';

type TabId = 'dashboard' | 'plans' | 'assessments';

const TABS: { id: TabId; label: string; icon: typeof BarChart3 }[] = [
  { id: 'dashboard', label: 'Desempenho', icon: BarChart3 },
  { id: 'plans', label: 'Treinos', icon: Dumbbell },
  { id: 'assessments', label: 'Avaliações', icon: Ruler },
];

/** Valor de ?aba= na URL de cada aba (a de desempenho é a padrão, sem parâmetro). */
const TAB_PARAM: Record<TabId, string | null> = { dashboard: null, plans: 'treinos', assessments: 'avaliacoes' };

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
  const abaParam = searchParams.get('aba');
  const tab: TabId = (Object.keys(TAB_PARAM) as TabId[]).find((t) => TAB_PARAM[t] === abaParam) ?? 'dashboard';
  // Aba visitada continua montada (só oculta): trocar de aba não perde um
  // rascunho de ficha em edição nem refaz as buscas do desempenho.
  const [visited, setVisited] = useState<Set<TabId>>(() => new Set([tab]));

  // Mesmo cache da lista: vindo dela, o perfil abre na hora.
  const studentsQ = useQuery({ queryKey: qk.students, queryFn: listStudents });
  const loading = studentsQ.isPending;
  const link = studentsQ.data?.find((l) => l.peer.id === id) ?? null;
  // A meta vem do ciclo, que a aba Desempenho também usa (mesma chave, uma busca só).
  const evolutionQ = useQuery({
    queryKey: qk.planEvolution(id ?? ''),
    queryFn: () => getStudentPlanEvolution(id!),
    enabled: !!link,
  });
  // O objetivo vigente vem do protocolo; sem ele, a meta do ciclo.
  const protocolQ = useStudentProtocol(id ?? '', !!link);
  const goal = protocolQ.data?.goal ? goalLabel(protocolQ.data.goal) : (evolutionQ.data?.goal ?? null);
  const engagementQ = useQuery({ queryKey: qk.engagement, queryFn: getEngagement, enabled: !!link });
  const engagement = engagementQ.data?.find((e) => e.studentId === id);
  const [endOpen, setEndOpen] = useState(false);
  const [ending, setEnding] = useState(false);
  const navigate = useNavigate();

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
      void refreshTrainerData();
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
    const param = TAB_PARAM[next];
    setSearchParams(param ? { aba: param } : {}, { replace: true });
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="flex h-[60px] shrink-0 items-center gap-2 border-b border-white/[0.07] px-8 text-sm">
        <Link to="/students" className="text-k-text-muted transition-colors hover:text-k-text">
          Alunos
        </Link>
        <span aria-hidden="true" className="text-k-text-muted/60">/</span>
        <span aria-current="page" className="truncate">{peer.nome}</span>
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
        <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-6 px-8 pt-8">
          <section className="flex flex-wrap items-center gap-4">
            <Avatar name={peer.nome} avatarUrl={peer.avatarUrl} size={56} />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-2xl font-semibold tracking-[-0.02em]">{peer.nome}</h1>
              <p className="truncate text-sm text-k-text-muted">
                {peer.email} · aluno desde {sinceLabel(link.respondedAt ?? link.createdAt)}
                {goal ? ` · meta: ${goal.toLowerCase()}` : ''}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {whatsappHref ? (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 items-center gap-1.5 rounded-lg border border-white/[0.12] px-3.5 text-[13px] text-k-text transition-colors hover:bg-white/[0.06]"
                >
                  <MessageCircle className="h-4 w-4 text-k-success" />
                  WhatsApp
                </a>
              ) : (
                <span title="O aluno não tem celular cadastrado." className="px-1 text-xs text-k-text-muted">
                  Sem WhatsApp cadastrado
                </span>
              )}
              <button
                type="button"
                onClick={() => selectTab('plans')}
                className="flex h-9 items-center gap-1.5 rounded-lg bg-k-primary px-3.5 text-[13px] font-semibold text-k-on-primary transition-colors hover:bg-[#7df1ff]"
              >
                <Dumbbell className="h-4 w-4" />
                Fichas de treino
              </button>
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
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.12] text-k-text-dim transition-colors hover:border-k-alert/40 hover:text-k-alert disabled:cursor-not-allowed disabled:opacity-40"
              >
                <UserMinus className="h-4 w-4" />
              </button>
            </div>
          </section>

          <StudentStatus engagement={engagement} loading={engagementQ.isPending} />

          <ProtocolSummary studentId={id} studentFirstName={firstName} />

          <div role="tablist" aria-label="Seções do aluno" className="flex gap-6 border-b border-white/[0.08]">
            {TABS.map((t) => {
              const active = t.id === tab;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  id={`student-tab-${t.id}`}
                  aria-selected={active}
                  aria-controls={`student-panel-${t.id}`}
                  onClick={() => selectTab(t.id)}
                  className={`-mb-px h-11 border-b-2 px-0.5 text-sm transition-colors ${
                    active ? 'border-k-primary text-k-text' : 'border-transparent text-k-text-dim hover:text-k-text'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {visited.has('dashboard') && (
          <div
            role="tabpanel"
            id="student-panel-dashboard"
            aria-labelledby="student-tab-dashboard"
            hidden={tab !== 'dashboard'}
          >
            <DashboardTab studentId={id} studentFirstName={firstName} />
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
        {visited.has('assessments') && (
          <div
            role="tabpanel"
            id="student-panel-assessments"
            aria-labelledby="student-tab-assessments"
            hidden={tab !== 'assessments'}
          >
            <AssessmentsTab studentId={id} studentFirstName={firstName} />
          </div>
        )}
      </div>
    </div>
  );
}

const RISK_META: Record<StudentEngagement['risk'], { label: string; dot: string }> = {
  ALTO: { label: 'Risco de abandono', dot: 'bg-k-alert' },
  MEDIO: { label: 'Precisa de atenção', dot: 'bg-k-warn' },
  OK: { label: 'Em dia', dot: 'bg-k-success' },
};

const lastSessionLabel = (e: StudentEngagement): string => {
  if (e.daysSinceLastSession === null) return 'Nunca registrou treino';
  if (e.daysSinceLastSession === 0) return 'Último treino hoje';
  if (e.daysSinceLastSession === 1) return 'Último treino ontem';
  return `Último treino há ${e.daysSinceLastSession} dias`;
};

/** Status do aluno em uma faixa: situação, motivo e os demais alertas do motor de risco. */
function StudentStatus({ engagement, loading }: { engagement: StudentEngagement | undefined; loading: boolean }) {
  if (loading) return <div className="k-skeleton h-[104px] rounded-xl bg-k-surface1" />;
  if (!engagement) return null;
  const meta = RISK_META[engagement.risk];
  const [primary, ...others] = engagement.alerts;
  return (
    <section
      aria-label="Status do aluno"
      className="grid gap-px overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.08] md:grid-cols-[minmax(240px,1fr)_2fr]"
    >
      <div className="flex flex-col gap-2 bg-k-bg p-5">
        <span className="text-xs text-k-text-muted">Status</span>
        <span className="flex items-center gap-2 text-lg font-semibold">
          <span className={`h-2 w-2 rounded-full ${meta.dot}`} aria-hidden="true" />
          {meta.label}
        </span>
        <span className="font-mono text-xs text-k-text-muted">
          {lastSessionLabel(engagement)}
          {engagement.adherencePercent !== null &&
            ` · aderência ${engagement.adherencePercent}% (${engagement.adherenceWindowDays}d)`}
        </span>
      </div>
      <div className="flex flex-col gap-2 bg-k-bg p-5">
        <span className="text-xs text-k-text-muted">{primary ? 'Por quê' : 'Situação'}</span>
        <p className="text-[15px] leading-relaxed">
          {primary ? primary.message : 'Treinando dentro do esperado. Nenhum alerta de abandono.'}
        </p>
        {others.map((a) => (
          <p key={a.type} className="text-[13px] text-k-text-muted">
            {a.message}
          </p>
        ))}
      </div>
    </section>
  );
}
