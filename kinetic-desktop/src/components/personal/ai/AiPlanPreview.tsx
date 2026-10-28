import { AnimatePresence, motion } from 'motion/react';
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Lock,
  Pencil,
  RefreshCw,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import AiFlowHeader, { AiFlowFooter } from './AiFlowHeader';
import { LEVELS, SECTIONS, muscleLabel } from '../workoutVocab';
import {
  attentionFor,
  autoSubtitle,
  dayLabel,
  setsByMuscle,
  totalSets,
  type AiRequestForm,
  type PreviewPlan,
} from './aiDraft';
import type { AiPlanNote, WorkoutExerciseInput } from '../../../types';

interface Props {
  studentFirstName: string;
  studentName: string;
  plans: PreviewPlan[];
  understood: AiPlanNote[];
  attentionPoints: AiPlanNote[];
  form: AiRequestForm;
  /** Fichas vigentes do aluno hoje (saem do app se o personal escolheu substituir). */
  currentPlanCount: number;
  active: number;
  onSelect: (index: number) => void;
  reviewed: boolean[];
  onToggleReviewed: (index: number) => void;
  agreed: boolean;
  onToggleAgreed: () => void;
  approving: boolean;
  approveError: string | null;
  onApprove: () => void;
  onRegenerate: () => void;
  onAdjust: () => void;
  onEdit: (index: number) => void;
  onDiscard: () => void;
}

/** Acento por posição (A/B/C ciclando) — o mesmo da lista de fichas e do app do aluno. */
const ACCENTS = [
  { text: 'text-k-primary', bg: 'bg-k-primary/[0.1]', ring: 'border-k-primary/25' },
  { text: 'text-k-warn', bg: 'bg-k-warn/[0.1]', ring: 'border-k-warn/25' },
  { text: 'text-k-success', bg: 'bg-k-success/[0.1]', ring: 'border-k-success/25' },
];

const CARD = 'rounded-2xl border border-k-ghost bg-k-surface1';
const SECTION_TITLE = 'font-display text-[15px] font-bold font-stretch-semi-expanded';
// No celular: número + exercício, com séries/carga/descanso numa linha abaixo do nome.
const ROW_GRID =
  'grid grid-cols-[28px_minmax(0,1fr)] gap-x-3 gap-y-1.5 md:grid-cols-[36px_minmax(0,2.6fr)_minmax(0,1fr)_minmax(0,1.4fr)_64px] md:gap-4';

/** Mesmo texto que o backend registra na aprovação (TrainerAiPlanService.DECLARATION_TEMPLATE). */
export const declarationText = (studentName: string) =>
  `Declaro que revisei integralmente as fichas desta prévia e que o treino é adequado para ${studentName}, ` +
  'considerando o objetivo, o nível e as restrições informadas. Assumo a prescrição como profissional responsável.';

const planMeta = (plan: PreviewPlan) => {
  const n = plan.input.exercises.length;
  const duration = plan.input.estimatedDurationMinutes;
  return `${n} ${n === 1 ? 'exercício' : 'exercícios'} · ${totalSets(plan.input)} séries${
    duration != null ? ` · ~${duration} min` : ''
  }`;
};

export default function AiPlanPreview({
  studentFirstName,
  studentName,
  plans,
  understood,
  attentionPoints,
  form,
  currentPlanCount,
  active,
  onSelect,
  reviewed,
  onToggleReviewed,
  agreed,
  onToggleAgreed,
  approving,
  approveError,
  onApprove,
  onRegenerate,
  onAdjust,
  onEdit,
  onDiscard,
}: Props) {
  const plan = plans[active];
  const reviewedCount = reviewed.filter(Boolean).length;
  const allReviewed = reviewedCount === plans.length;
  const ready = allReviewed && agreed;
  const exerciseCount = plans.reduce((sum, p) => sum + p.input.exercises.length, 0);
  const setCount = plans.reduce((sum, p) => sum + totalSets(p.input), 0);
  const fichas = plans.length === 1 ? 'a ficha' : `as ${plans.length} fichas`;

  const single = plans.length === 1;
  let progressText: string;
  if (!allReviewed) {
    progressText = `${reviewedCount} de ${plans.length} ${single ? 'ficha revisada' : 'fichas revisadas'}. Revise ${
      single ? 'a ficha' : 'todas'
    } para liberar a aprovação.`;
  } else if (!agreed) {
    progressText = `${single ? 'A ficha foi revisada' : `As ${plans.length} fichas foram revisadas`}. Confirme a declaração para liberar.`;
  } else {
    progressText = `Tudo pronto. ${single ? 'A ficha vai' : 'As fichas vão'} para o app assim que você aprovar.`;
  }

  const approveButton = () => (
    <motion.button
      type="button"
      onClick={onApprove}
      disabled={!ready || approving}
      whileTap={ready && !approving ? { scale: 0.97 } : undefined}
      title={ready ? undefined : `Revise ${fichas} e confirme a declaração no fim da página`}
      className={`flex items-center gap-2 rounded-[10px] font-bold transition-[box-shadow,background-color,color] disabled:cursor-not-allowed ${
        approving ? 'disabled:cursor-wait' : ''
      } ${
        'h-11 px-5 text-sm'
      } ${
        ready
          ? 'bg-k-primary text-k-on-primary hover:shadow-[0_0_0_4px_rgba(0,229,255,0.14),0_12px_28px_-12px_rgba(0,229,255,0.8)]'
          : 'bg-k-surface2 text-k-text-muted'
      }`}
    >
      {approving ? (
        <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
      ) : ready ? (
        <Check className="h-4 w-4" strokeWidth={2.4} />
      ) : (
        <Lock className="h-4 w-4" />
      )}
      {approving ? 'Enviando…' : `Aprovar e enviar para ${studentFirstName}`}
    </motion.button>
  );

  return (
    <div className="flex min-h-full flex-col">
      <AiFlowHeader
        step={allReviewed ? 3 : 2}
        studentFirstName={studentFirstName}
        onBack={onAdjust}
        backLabel="Voltar para o pedido"
        note={
          <span className="tabular-nums">
            rascunho da IA, ainda não está no app · {exerciseCount} exercícios · {setCount} séries
          </span>
        }
      />

      <div className="mx-auto flex w-full max-w-[1120px] flex-1 flex-wrap items-start gap-5 px-4 md:px-8 py-6">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-4">
          {attentionPoints.length > 0 && (
            <section aria-labelledby="ai-attention-title" className={`flex flex-col gap-3 px-4 py-4 md:px-5 ${CARD}`}>
              <div className="flex flex-wrap items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-k-warn" />
                <h3 id="ai-attention-title" className="text-sm font-bold">
                  {attentionPoints.length === 1 ? '1 ponto para conferir' : `${attentionPoints.length} pontos para conferir`}
                </h3>
                <span className="text-[12.5px] text-k-text-muted">· levantados pela IA a partir da anamnese</span>
              </div>
              <ul className="grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(min(210px,100%),1fr))]">
                {attentionPoints.map((point) => (
                  <li key={point.title} className="flex flex-col gap-1 rounded-[10px] bg-k-bg p-3">
                    <span className="text-[13px] font-semibold">{point.title}</span>
                    {point.detail && (
                      <span className="text-[12.5px] leading-normal text-k-text-dim">{point.detail}</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {plans.length > 1 && (
            <div
              role="tablist"
              aria-label="Fichas da prévia"
              className="grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(min(190px,100%),1fr))]"
            >
              {plans.map((p, i) => {
                const accent = ACCENTS[i % ACCENTS.length];
                const selected = i === active;
                return (
                  <button
                    key={i}
                    type="button"
                    role="tab"
                    id={`ai-plan-tab-${i}`}
                    aria-selected={selected}
                    aria-controls="ai-plan-panel"
                    onClick={() => onSelect(i)}
                    className={`flex flex-col items-start gap-1.5 rounded-xl border bg-k-surface1 px-3.5 py-3 text-left transition-colors ${
                      selected ? 'border-k-primary/45' : 'border-k-ghost hover:border-white/[0.16]'
                    }`}
                  >
                    <span className="flex w-full items-center justify-between gap-2">
                      <span className={`font-mono text-[11.5px] font-semibold ${accent.text}`}>
                        {dayLabel(p.input.tag, i)}
                      </span>
                      {reviewed[i] ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-k-success">
                          <CheckCircle2 className="h-[13px] w-[13px]" strokeWidth={2.4} />
                          Revisada
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-k-text-muted">
                          <span className="h-[7px] w-[7px] rounded-full border-[1.5px] border-k-text-muted" />A revisar
                        </span>
                      )}
                    </span>
                    <span className="line-clamp-1 text-[13.5px] font-semibold">{p.input.title}</span>
                    <span className="font-mono text-[11.5px] tabular-nums text-k-text-muted">{planMeta(p)}</span>
                  </button>
                );
              })}
            </div>
          )}

          <AnimatePresence mode="wait" initial={false}>
            <motion.section
              key={active}
              id="ai-plan-panel"
              role={plans.length > 1 ? 'tabpanel' : undefined}
              aria-labelledby={plans.length > 1 ? `ai-plan-tab-${active}` : undefined}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4, transition: { duration: 0.12 } }}
              transition={{ duration: 0.3 }}
              className={`overflow-hidden ${CARD}`}
            >
              <PlanTable
                plan={plan}
                index={active}
                level={form.level}
                onEdit={() => onEdit(active)}
              />

              <div
                className={`flex flex-wrap items-center justify-between gap-3 border-t border-k-ghost px-4 py-4 transition-colors md:px-5 ${
                  reviewed[active] ? 'bg-k-success/[0.05]' : 'bg-[#181818]'
                }`}
              >
                <label className="flex min-w-0 flex-[1_1_380px] cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={reviewed[active]}
                    onChange={() => onToggleReviewed(active)}
                    className="h-5 w-5 shrink-0 cursor-pointer accent-k-success"
                  />
                  <span className="text-sm leading-normal">
                    <strong className="font-semibold">Revisei a ficha {dayLabel(plan.input.tag, active)}</strong>
                    <span className="text-k-text-muted"> · exercícios, séries, cargas e descanso</span>
                  </span>
                </label>
                {active < plans.length - 1 && (
                  <button
                    type="button"
                    onClick={() => onSelect(active + 1)}
                    className="flex h-10 items-center gap-1.5 rounded-[10px] border border-white/10 bg-k-surface2 px-3.5 text-[13px] font-semibold transition-colors hover:border-white/20"
                  >
                    Próxima: {dayLabel(plans[active + 1].input.tag, active + 1)}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </motion.section>
          </AnimatePresence>

          <section
            aria-labelledby="ai-approval-title"
            className={`flex flex-col gap-4 rounded-2xl border bg-k-surface1 p-5 transition-colors ${
              allReviewed && agreed ? 'border-k-primary/40' : 'border-k-ghost'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-[18px] w-[18px] text-k-primary" />
                <h3 id="ai-approval-title" className={SECTION_TITLE}>
                  Aprovação profissional
                </h3>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-[12.5px] tabular-nums text-k-text-dim">
                  {reviewedCount} de {plans.length} {plans.length === 1 ? 'revisada' : 'revisadas'}
                </span>
                <span aria-hidden="true" className="flex gap-1">
                  {reviewed.map((done, i) => (
                    <span
                      key={i}
                      className={`h-1 w-7 rounded-full transition-colors duration-300 ${done ? 'bg-k-primary' : 'bg-k-surface3'}`}
                    />
                  ))}
                </span>
              </div>
            </div>

            <label
              className={`flex items-start gap-3 rounded-xl border border-k-ghost bg-k-bg px-4 py-3.5 transition-opacity ${
                allReviewed ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
              }`}
            >
              <input
                type="checkbox"
                checked={agreed}
                onChange={onToggleAgreed}
                disabled={!allReviewed || approving}
                className="mt-0.5 h-[18px] w-[18px] shrink-0 cursor-pointer accent-k-primary disabled:cursor-not-allowed"
              />
              <span className="text-[13px] leading-relaxed text-k-text-soft">{declarationText(studentName)}</span>
            </label>

            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[12.5px] leading-normal text-k-text-muted">
              <li className="flex items-center gap-1.5">
                <UserRound className="h-3.5 w-3.5 shrink-0" />
                {plans.length === 1 ? 'Aparece' : 'Aparecem'} no app como {plans.length === 1 ? 'prescrita' : 'prescritas'} por você
              </li>
              <li className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                Aceite registrado com data, hora, pedido e versão aprovada
              </li>
              {currentPlanCount > 0 && (
                <li className="flex items-center gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5 shrink-0" />
                  {form.replace
                    ? `${currentPlanCount === 1 ? 'A ficha atual sai' : `As ${currentPlanCount} fichas atuais saem`} do app`
                    : `${currentPlanCount === 1 ? 'A ficha atual continua' : `As ${currentPlanCount} fichas atuais continuam`} no app`}
                </li>
              )}
            </ul>

            <AnimatePresence>
              {approveError && (
                <motion.div
                  key="approve-error"
                  role="alert"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start gap-2.5 rounded-xl border border-k-alert/25 bg-k-alert/[0.08] px-4 py-3 text-[13px] leading-snug text-k-alert"
                >
                  <AlertCircle className="mt-px h-4 w-4 shrink-0" />
                  <span>{approveError}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>

        <aside className="flex min-w-0 flex-[1_1_320px] flex-col gap-4">
          <section aria-labelledby="ai-request-title" className={`flex flex-col gap-3 p-5 ${CARD}`}>
            <div className="flex items-center justify-between gap-2.5">
              <h3 id="ai-request-title" className={SECTION_TITLE}>
                Seu pedido
              </h3>
              <button
                type="button"
                onClick={onAdjust}
                className="flex items-center gap-1.5 text-[13px] font-semibold text-k-primary hover:underline"
              >
                Ajustar
              </button>
            </div>
            <p className="whitespace-pre-line text-[13px] leading-relaxed text-k-text-soft">{form.prompt.trim()}</p>
            <p className="font-mono text-[11.5px] leading-normal text-k-text-muted">
              {form.scope === 'full' ? `Divisão completa · ${form.count} fichas` : '1 ficha'}
              {form.duration.trim() ? ` · até ${form.duration.trim()} min` : ''} ·{' '}
              {LEVELS.find((l) => l.value === form.level)?.label ?? form.level}
              {currentPlanCount > 0 ? (form.replace ? ' · substitui as fichas atuais' : ' · mantém as fichas atuais') : ''}
            </p>
          </section>

          {understood.length > 0 && (
            <section aria-labelledby="ai-understood-title" className={`flex flex-col gap-3 p-5 ${CARD}`}>
              <div>
                <h3
                  id="ai-understood-title"
                  className={SECTION_TITLE}
                >
                  Como a IA entendeu
                </h3>
                <p className="mt-0.5 text-[12.5px] text-k-text-muted">Confira se bate com o que você pediu.</p>
              </div>
              <ul className="flex flex-col gap-3">
                {understood.map((item) => (
                  <li key={item.title} className="flex gap-2.5">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-k-success" strokeWidth={2.6} />
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold">{item.title}</p>
                      {item.detail && <p className="mt-px text-xs text-k-text-muted">{item.detail}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <VolumeCard plans={plans} />
        </aside>
      </div>

      <AiFlowFooter
        summary={
          <span className={`text-[13px] ${allReviewed ? 'text-k-success' : 'text-k-text-dim'}`}>{progressText}</span>
        }
      >
        <button
          type="button"
          onClick={onDiscard}
          disabled={approving}
          className="h-11 rounded-[10px] px-4 text-sm font-semibold text-k-alert transition-colors hover:bg-k-alert/[0.08] disabled:opacity-50"
        >
          Descartar prévia
        </button>
        <button
          type="button"
          onClick={onRegenerate}
          disabled={approving}
          className="group flex h-11 items-center gap-2 rounded-[10px] border border-white/10 px-4 text-sm font-semibold text-k-text-soft transition-colors hover:bg-k-surface2 hover:text-k-text disabled:opacity-50"
        >
          <RefreshCw className="h-[15px] w-[15px] transition-transform duration-500 group-hover:rotate-180" />
          Gerar de novo
        </button>
        {approveButton()}
      </AiFlowFooter>
    </div>
  );
}

// ─── Ficha em leitura ────────────────────────────────────────────────────────

function PlanTable({
  plan,
  index,
  level,
  onEdit,
}: {
  plan: PreviewPlan;
  index: number;
  level: string;
  onEdit: () => void;
}) {
  const accent = ACCENTS[index % ACCENTS.length];
  const subtitle = plan.input.subtitle?.trim() || autoSubtitle(plan.input);
  // Numeração na ordem da ficha; a exibição agrupa por seção, como no app do aluno.
  const numbered = plan.input.exercises.map((ex, i) => ({ ex, n: String(i + 1).padStart(2, '0') }));
  const groups = SECTIONS.map((section) => ({
    ...section,
    items: numbered.filter(({ ex }) => ex.section === section.value),
  })).filter((g) => g.items.length > 0);

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 pb-4 pt-5 md:px-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-md px-2 py-[3px] font-mono text-[11.5px] font-semibold ${accent.text} ${accent.bg}`}>
              {dayLabel(plan.input.tag, index)}
            </span>
            {plan.edited && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-white/[0.06] px-2 py-[3px] text-xs font-semibold text-k-text-soft">
                <Pencil className="h-3 w-3" />
                Editada por você
              </span>
            )}
          </div>
          <h3 className="mt-2 font-display text-xl font-extrabold tracking-tight font-stretch-semi-expanded">
            {plan.input.title}
          </h3>
          {subtitle && <p className="mt-1 text-[12.5px] text-k-text-muted">{subtitle}</p>}
          <p className="mt-1.5 font-mono text-[12.5px] tabular-nums text-k-text-dim">
            {planMeta(plan)} · {LEVELS.find((l) => l.value === (plan.input.level ?? level))?.label ?? plan.input.level}
          </p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="flex h-10 items-center gap-1.5 rounded-[10px] border border-white/10 px-3.5 text-[13px] font-semibold text-k-text-soft transition-colors hover:bg-k-surface2 hover:text-k-text"
        >
          <Pencil className="h-3.5 w-3.5" />
          Editar ficha
        </button>
      </div>

      <div className="overflow-x-auto">
        <div role="table" aria-label="Exercícios da ficha" className="md:min-w-[760px]">
          <div
            role="row"
            className={`${ROW_GRID} border-t border-k-ghost bg-[#181818] px-4 py-2.5 text-[11px] md:px-5 font-semibold uppercase tracking-[0.07em] text-k-text-muted`}
          >
            <span role="columnheader">#</span>
            <span role="columnheader">Exercício</span>
            <span role="columnheader" className="max-md:hidden">Séries × reps</span>
            <span role="columnheader" className="max-md:hidden">Carga</span>
            <span role="columnheader" className="max-md:hidden">Descanso</span>
          </div>
          {groups.map((group) => (
            <div key={group.value} role="rowgroup" aria-label={group.label}>
              <div className="flex items-center gap-2 border-t border-white/[0.05] px-4 pb-2 pt-3 md:px-5 text-[11px] font-semibold uppercase tracking-[0.07em] text-k-text-muted">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ background: group.color }} />
                {group.label}
                <span className="font-mono font-normal normal-case tracking-normal">{group.items.length}</span>
              </div>
              {group.items.map(({ ex, n }) => (
                <ExerciseRow key={n} n={n} ex={ex} attention={attentionFor(plan, ex.name)} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function ExerciseRow({ n, ex, attention }: { n: string; ex: WorkoutExerciseInput; attention: string | null }) {
  const meta = [ex.muscles ? muscleLabel(ex.muscles) : null, ex.type ? ex.type.toLowerCase() : null]
    .filter(Boolean)
    .join(' · ');
  return (
    <div role="row" className={`${ROW_GRID} items-baseline border-t border-white/[0.05] px-4 py-3.5 md:px-5`}>
      <span role="cell" className="font-mono text-[13px] tabular-nums text-k-text-muted">
        {n}
      </span>
      <div role="cell" className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-semibold">{ex.name}</span>
        {meta && <span className="text-xs text-k-text-muted first-letter:uppercase">{meta}</span>}
        {ex.notes && <p className="mt-1 text-[12.5px] leading-normal text-k-text-dim">{ex.notes}</p>}
        {attention && (
          <p className="mt-1 flex items-start gap-1.5 text-[12.5px] leading-normal text-k-warn">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {attention}
          </p>
        )}
      </div>
      <div className="col-start-2 flex flex-wrap gap-x-4 gap-y-1 md:contents">
      <span role="cell" className="font-mono text-[13px] tabular-nums">
        {ex.sets} × {ex.reps}
      </span>
      <span role="cell" className="text-[13px] text-k-text-soft">
        {ex.weight ?? '—'}
      </span>
      <span role="cell" className="font-mono text-[13px] tabular-nums text-k-text-dim">
        {ex.restTime ?? '—'}
      </span>
      </div>
    </div>
  );
}

// ─── Séries por grupo muscular ───────────────────────────────────────────────

function VolumeCard({ plans }: { plans: PreviewPlan[] }) {
  const rows = setsByMuscle(plans);
  if (rows.length === 0) return null;
  const max = rows[0].value;

  return (
    <section aria-labelledby="ai-volume-title" className={`flex flex-col gap-3.5 p-5 ${CARD}`}>
      <div>
        <h3 id="ai-volume-title" className={SECTION_TITLE}>
          Séries por grupo muscular
        </h3>
        <p className="mt-0.5 text-[12.5px] text-k-text-muted">
          {plans.length === 1 ? 'Da ficha' : `Soma das ${plans.length} fichas`}, sem mobilidade, core e cardio.
        </p>
      </div>
      <ul className="flex flex-col gap-[9px]">
        {rows.map((row) => (
          <li key={row.label} className="grid grid-cols-[84px_minmax(0,1fr)_24px] items-center gap-2.5 text-[12.5px]">
            <span className="text-k-text-dim">{row.label}</span>
            <span aria-hidden="true" className="h-1.5 overflow-hidden rounded bg-k-surface2">
              <span
                className="block h-full rounded bg-k-chart-2 transition-[width] duration-500"
                style={{ width: `${Math.round((row.value / max) * 100)}%` }}
              />
            </span>
            <span className="text-right font-mono tabular-nums">{row.value}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
