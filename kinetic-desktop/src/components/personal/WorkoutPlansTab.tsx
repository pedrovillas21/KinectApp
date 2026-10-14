import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { toast } from 'sonner';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Copy,
  Dumbbell,
  Pencil,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  UserRound,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { archiveStudentPlan, listStudentPlans } from '../../services/trainerService';
import { EASE_OUT, riseItem, staggerContainer } from '../motion/primitives';
import ConfirmDialog from './ConfirmDialog';
import PlanEditor, { type EditorMode } from './PlanEditor';
import { heuristicDurationMinutes, muscleLabel } from './workoutVocab';
import type { WorkoutPlan } from '../../types';

interface Props {
  studentId: string;
  studentFirstName: string;
}

/** Acento por posição (A/B/C ciclando) — o mesmo do app do aluno. */
const ACCENTS = [
  { text: 'text-k-primary', bg: 'bg-k-primary/[0.1]', ring: 'border-k-primary/25' },
  { text: 'text-k-warn', bg: 'bg-k-warn/[0.1]', ring: 'border-k-warn/25' },
  { text: 'text-k-success', bg: 'bg-k-success/[0.1]', ring: 'border-k-success/25' },
];
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** "A", "dia b", "DIA C" → "A"/"B"/"C" (o app exibe sempre como "DIA X"). */
const bareTag = (tag: string | null) => (tag ?? '').trim().toUpperCase().replace(/^DIA\s+/, '');

const dayLabel = (plan: WorkoutPlan, index: number) => `DIA ${bareTag(plan.tag) || LETTERS[index % 26]}`;

/** Primeira letra ainda não usada pelas fichas vigentes. */
const nextTag = (plans: WorkoutPlan[]) => {
  const used = new Set(plans.map((p) => bareTag(p.tag)));
  return [...LETTERS].find((l) => !used.has(l)) ?? '';
};

const nf0 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

const lastDoneLabel = (iso: string | null): string => {
  if (!iso) return 'Ainda não realizada';
  const done = new Date(iso);
  if (Number.isNaN(done.getTime())) return 'Ainda não realizada';
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOf(new Date()) - startOf(done)) / 86_400_000);
  if (days <= 0) return 'Feita hoje';
  if (days === 1) return 'Feita ontem';
  return `Feita há ${days} dias`;
};

export default function WorkoutPlansTab({ studentId, studentFirstName }: Props) {
  const { currentUser } = useAuth();
  const [plans, setPlans] = useState<WorkoutPlan[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [editor, setEditor] = useState<EditorMode | null>(null);
  // A ficha alvo continua definida enquanto o diálogo anima o fechamento (o texto não some).
  const [toRemove, setToRemove] = useState<WorkoutPlan | null>(null);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    setPlans(null);
    setEditor(null);
  }, [studentId]);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    listStudentPlans(studentId)
      .then((data) => {
        if (!cancelled) setPlans(data);
      })
      .catch(() => {
        if (!cancelled) setError(`Não foi possível carregar as fichas de ${studentFirstName}.`);
      });
    return () => {
      cancelled = true;
    };
  }, [studentId, studentFirstName, reloadKey]);

  const reload = () => setReloadKey((k) => k + 1);

  const handleSaved = (_plan: WorkoutPlan, created: boolean) => {
    setEditor(null);
    toast.success(
      created
        ? `Ficha criada. Já aparece no app de ${studentFirstName}.`
        : `Ficha atualizada no app de ${studentFirstName}.`,
    );
    // Recarrega para trazer a ordem e a última execução como o app vê.
    reload();
  };

  const confirmRemove = async () => {
    if (!toRemove) return;
    setRemoving(true);
    try {
      await archiveStudentPlan(studentId, toRemove.id);
      setPlans((list) => list?.filter((p) => p.id !== toRemove.id) ?? null);
      toast.success(`"${toRemove.title}" saiu do app de ${studentFirstName}.`);
      setRemoveOpen(false);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 404) {
        toast.error('Esta ficha já tinha sido removida.');
        setRemoveOpen(false);
        reload();
      } else {
        toast.error('Não foi possível remover a ficha. Tente de novo.');
      }
    } finally {
      setRemoving(false);
    }
  };

  if (editor) {
    return (
      <PlanEditor
        key={editor.kind === 'edit' ? editor.plan.id : 'new'}
        studentId={studentId}
        studentFirstName={studentFirstName}
        mode={editor}
        onCancel={() => setEditor(null)}
        onSaved={handleSaved}
      />
    );
  }

  const startCreate = (source?: WorkoutPlan) =>
    setEditor({ kind: 'create', suggestedTag: nextTag(plans ?? []), source });

  return (
    <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-5 px-8 py-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-[22px] font-extrabold tracking-tight font-stretch-semi-expanded">
            Treinos
          </h2>
          <p className="mt-0.5 text-[13px] text-k-text-muted">
            Fichas ativas no app de {studentFirstName}. O que você salvar aparece para ele na hora.
          </p>
        </div>
        {plans && plans.length > 0 && <NewPlanButton onClick={() => startCreate()} />}
      </div>

      {error && !plans ? (
        <div
          role="alert"
          className="flex flex-col items-center gap-4 rounded-[20px] border border-k-alert/25 bg-k-surface1 px-6 py-12 text-center"
        >
          <AlertCircle className="h-8 w-8 text-k-alert" />
          <p className="text-sm font-semibold">{error}</p>
          <button
            type="button"
            onClick={reload}
            className="group flex h-11 items-center gap-2 rounded-xl border border-white/[0.14] bg-k-surface1 px-4 text-sm font-semibold transition-colors hover:bg-k-surface2"
          >
            <RefreshCw className="h-4 w-4 text-k-primary transition-transform duration-500 group-hover:rotate-180" />
            Tentar novamente
          </button>
        </div>
      ) : !plans ? (
        <PlansSkeleton />
      ) : plans.length === 0 ? (
        <EmptyPlans firstName={studentFirstName} onCreate={() => startCreate()} />
      ) : (
        <motion.ul
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid gap-4 md:grid-cols-2"
        >
          <AnimatePresence initial={false}>
            {plans.map((plan, i) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                index={i}
                mine={plan.prescribedByName !== null && plan.prescribedByName === currentUser?.nome}
                onEdit={() => setEditor({ kind: 'edit', plan })}
                onDuplicate={() => startCreate(plan)}
                onRemove={() => {
                  setToRemove(plan);
                  setRemoveOpen(true);
                }}
              />
            ))}
          </AnimatePresence>
        </motion.ul>
      )}

      <ConfirmDialog
        open={removeOpen}
        title="Remover ficha do app?"
        description={
          <>
            <strong className="text-k-text">{toRemove?.title}</strong> deixa de aparecer para {studentFirstName}. O
            histórico de treinos feitos com ela continua nas estatísticas.
          </>
        }
        confirmLabel="Remover ficha"
        destructive
        busy={removing}
        onConfirm={() => void confirmRemove()}
        onCancel={() => setRemoveOpen(false)}
      />
    </div>
  );
}

// ─── Card de ficha ───────────────────────────────────────────────────────────

function PlanCard({
  plan,
  index,
  mine,
  onEdit,
  onDuplicate,
  onRemove,
}: {
  plan: WorkoutPlan;
  index: number;
  mine: boolean;
  onEdit: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  const accent = ACCENTS[index % ACCENTS.length];
  const totalSets = plan.data.reduce((sum, e) => sum + (e.sets ?? 0), 0);
  const duration = plan.estimatedDurationMinutes ?? heuristicDurationMinutes(totalSets);
  const muscles = Array.from(new Set(plan.data.map((e) => (e.muscles ?? '').trim()).filter(Boolean)));
  const isAi = plan.prescribedByName === null;

  return (
    <motion.li
      layout
      variants={riseItem}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.2 } }}
      className="group flex flex-col gap-4 rounded-[20px] border border-k-ghost bg-k-surface1 p-5 transition-[translate,border-color] duration-300 hover:-translate-y-[3px] hover:border-white/[0.16]"
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`inline-flex h-7 items-center rounded-full border px-3 font-display text-[12px] font-extrabold tracking-wide font-stretch-semi-expanded ${accent.text} ${accent.bg} ${accent.ring}`}
        >
          {dayLabel(plan, index)}
        </span>
        {isAi ? (
          <span
            className="inline-flex h-7 items-center gap-1.5 rounded-full bg-k-warn/[0.1] px-3 text-[12px] font-semibold text-k-warn"
            title="Gerada pela IA do app. Revise e salve para assumir a ficha."
          >
            <Sparkles className="h-3.5 w-3.5" />
            Gerada por IA
          </span>
        ) : (
          <span className="inline-flex h-7 max-w-[60%] items-center gap-1.5 rounded-full bg-k-success/[0.1] px-3 text-[12px] font-semibold text-k-success">
            {mine ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <UserRound className="h-3.5 w-3.5 shrink-0" />}
            <span className="truncate">{mine ? 'Prescrita por você' : `Prescrita por ${plan.prescribedByName}`}</span>
          </span>
        )}
      </div>

      <div className="min-w-0">
        <h3 className="truncate font-display text-xl font-extrabold uppercase tracking-tight font-stretch-semi-expanded">
          {plan.title}
        </h3>
        {plan.subtitle && <p className="mt-1 line-clamp-1 text-[13px] text-k-text-dim">{plan.subtitle}</p>}
        <p className="mt-2 text-[12.5px] tabular-nums text-k-text-muted">
          {plan.data.length} {plan.data.length === 1 ? 'exercício' : 'exercícios'} · {totalSets} séries · ~{duration}{' '}
          min
          {plan.estimatedTotalVolumeKg != null && <> · ≈ {nf0.format(plan.estimatedTotalVolumeKg)} kg de volume</>}
        </p>
      </div>

      {muscles.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {muscles.map((m) => (
            <span key={m} className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[11.5px] font-semibold text-k-text-soft">
              {muscleLabel(m)}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/[0.05] pt-4">
        <span className="flex min-w-0 items-center gap-1.5 text-[12.5px] text-k-text-muted">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{lastDoneLabel(plan.lastCompletedAt)}</span>
        </span>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onDuplicate}
            aria-label={`Duplicar ${plan.title}`}
            title="Duplicar"
            className="flex h-9 w-9 items-center justify-center rounded-[10px] text-k-text-muted transition-colors hover:bg-white/[0.06] hover:text-k-text"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remover ${plan.title} do app`}
            title="Remover do app"
            className="flex h-9 w-9 items-center justify-center rounded-[10px] text-k-text-muted transition-colors hover:bg-k-alert/10 hover:text-k-alert"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="ml-1 flex h-9 items-center gap-1.5 rounded-[10px] border border-k-primary/30 bg-k-primary/[0.08] px-3.5 text-[13px] font-semibold text-k-primary transition-colors hover:bg-k-primary/[0.16]"
          >
            <Pencil className="h-3.5 w-3.5" />
            {isAi ? 'Revisar' : 'Editar'}
          </button>
        </div>
      </div>
    </motion.li>
  );
}

// ─── Estados ─────────────────────────────────────────────────────────────────

function NewPlanButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className="flex h-11 items-center gap-2 rounded-xl bg-k-primary px-5 text-sm font-bold text-k-on-primary transition-shadow hover:shadow-[0_0_0_4px_rgba(0,229,255,0.14),0_10px_26px_-10px_rgba(0,229,255,0.8)]"
    >
      <Plus className="h-4 w-4" />
      Nova ficha
    </motion.button>
  );
}

function EmptyPlans({ firstName, onCreate }: { firstName: string; onCreate: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE_OUT }}
      className="flex flex-col items-center gap-4 rounded-[20px] border border-dashed border-white/10 px-6 py-14 text-center"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-k-primary/[0.12] text-k-primary">
        <Dumbbell className="h-6 w-6" />
      </span>
      <div>
        <p className="font-display text-lg font-extrabold font-stretch-semi-expanded">
          {firstName} ainda não tem fichas
        </p>
        <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-k-text-muted">
          Monte a primeira ficha. Ela aparece na hora no app, pronta para {firstName} treinar e registrar as séries.
        </p>
      </div>
      <NewPlanButton onClick={onCreate} />
    </motion.div>
  );
}

function PlansSkeleton() {
  return (
    <div role="status" aria-label="Carregando fichas" className="grid gap-4 md:grid-cols-2">
      {[0, 1].map((i) => (
        <div
          key={i}
          className="k-skeleton flex flex-col gap-4 rounded-[20px] border border-white/[0.06] bg-k-surface1 p-5"
          style={{ animationDelay: `${i * 120}ms` }}
        >
          <div className="flex justify-between">
            <div className="h-7 w-20 rounded-full bg-k-surface2" />
            <div className="h-7 w-28 rounded-full bg-[#242424]" />
          </div>
          <div className="h-5 w-[55%] rounded-full bg-k-surface2" />
          <div className="h-3 w-[70%] rounded-full bg-[#242424]" />
          <div className="flex gap-1.5">
            <div className="h-6 w-14 rounded-full bg-[#242424]" />
            <div className="h-6 w-16 rounded-full bg-[#242424]" />
          </div>
          <div className="h-9 border-t border-white/[0.05]" />
        </div>
      ))}
    </div>
  );
}
