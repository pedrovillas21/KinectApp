import { AnimatePresence, motion } from 'motion/react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Lock,
  Pencil,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react';
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

const CARD = 'rounded-[20px] border border-k-ghost bg-k-surface1';
const ROW_GRID = 'grid grid-cols-[36px_minmax(0,2.6fr)_minmax(0,1fr)_minmax(0,1.5fr)_72px] gap-4';

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

  const progressText = allReviewed
    ? agreed
      ? `Tudo pronto. ${plans.length === 1 ? 'A ficha vai' : 'As fichas vão'} para o app assim que você aprovar.`
      : `${plans.length === 1 ? 'A ficha foi revisada' : `As ${plans.length} fichas foram revisadas`}. Confirme a declaração para liberar.`
    : `${reviewedCount} de ${plans.length} ${plans.length === 1 ? 'ficha revisada' : 'fichas revisadas'}. Revise ${
        plans.length === 1 ? 'a ficha' : 'todas'
      } para liberar a aprovação.`;

  const approveButton = (size: 'sm' | 'lg') => (
    <motion.button
      type="button"
      onClick={onApprove}
      disabled={!ready || approving}
      whileTap={ready && !approving ? { scale: 0.97 } : undefined}
      title={ready ? undefined : `Revise ${fichas} e confirme a declaração no fim da página`}
      className={`flex items-center gap-2 rounded-xl font-bold transition-[box-shadow,background-color,color] disabled:cursor-not-allowed ${
        approving ? 'disabled:cursor-wait' : ''
      } ${
        size === 'lg' ? 'h-[46px] px-[22px] text-[15px]' : 'h-10 px-[18px] text-sm'
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
      {approving ? 'Enviando…' : size === 'lg' ? `Aprovar e enviar para ${studentFirstName}` : 'Aprovar e enviar'}
    </motion.button>
  );

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-20 border-b border-k-ghost bg-k-bg/85 backdrop-blur-[14px]">
        <div className="mx-auto flex w-full max-w-[1240px] flex-wrap items-center justify-between gap-3 px-8 py-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onAdjust}
              aria-label="Voltar para o pedido"
              className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-k-surface1 text-k-text-dim transition-colors hover:bg-k-surface2 hover:text-k-text"
            >
              <ArrowLeft className="h-[17px] w-[17px] transition-transform duration-300 group-hover:-translate-x-0.5" />
            </button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="font-display text-lg font-extrabold tracking-tight font-stretch-semi-expanded">
                  Prévia {plans.length === 1 ? 'da ficha' : 'das fichas'}
                </h2>
                <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-k-warn/[0.12] px-2.5 text-xs font-semibold text-k-warn">
                  <Sparkles className="h-3 w-3" />
                  Rascunho da IA · ainda não está no app
                </span>
              </div>
              <p className="mt-0.5 text-[12.5px] tabular-nums text-k-text-muted">
                {plans.length} {plans.length === 1 ? 'ficha' : 'fichas'} · {exerciseCount} exercícios · {setCount}{' '}
                séries · {reviewedCount} de {plans.length} {plans.length === 1 ? 'revisada' : 'revisadas'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onRegenerate}
              disabled={approving}
              className="group flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-k-surface1 px-4 text-sm font-semibold text-k-text-dim transition-colors hover:bg-k-surface2 hover:text-k-text disabled:opacity-50"
            >
              <RefreshCw className="h-[15px] w-[15px] transition-transform duration-500 group-hover:rotate-180" />
              Gerar de novo
            </button>
            {approveButton('sm')}
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1240px] flex-wrap items-start gap-5 px-8 py-6">
        <div className="flex min-w-0 flex-[999_1_600px] flex-col gap-4">
          {attentionPoints.length > 0 && (
            <section
              aria-labelledby="ai-attention-title"
              className="flex flex-col gap-2.5 rounded-[18px] border border-k-warn/[0.22] bg-k-warn/[0.06] px-5 py-[18px]"
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="h-[18px] w-[18px] text-k-warn" />
                <h3
                  id="ai-attention-title"
                  className="font-display text-[15px] font-extrabold font-stretch-semi-expanded"
                >
                  {attentionPoints.length === 1 ? '1 ponto para você conferir' : `${attentionPoints.length} pontos para você conferir`}
                </h3>
              </div>
              <ul className="flex list-disc flex-col gap-2 pl-[46px] text-[13.5px] leading-normal text-k-text-soft marker:text-k-warn">
                {attentionPoints.map((point) => (
                  <li key={point.title}>
                    <strong className="text-k-warn">{point.title}.</strong> {point.detail}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {plans.length > 1 && (
            <div
              role="tablist"
              aria-label="Fichas da prévia"
              className="grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]"
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
                    className={`flex flex-col items-start gap-2 rounded-2xl border px-4 py-3.5 text-left transition-colors ${
                      selected
                        ? 'border-k-primary/45 bg-k-primary/[0.06]'
                        : 'border-k-ghost bg-k-surface1 hover:border-white/[0.16]'
                    }`}
                  >
                    <span className="flex w-full items-center justify-between gap-2">
                      <span
                        className={`inline-flex h-6 items-center rounded-full border px-2.5 font-display text-[11.5px] font-extrabold tracking-wide font-stretch-semi-expanded ${accent.text} ${accent.bg} ${accent.ring}`}
                      >
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
                    <span className="line-clamp-1 text-sm font-semibold">{p.input.title}</span>
                    <span className="text-xs tabular-nums text-k-text-muted">{planMeta(p)}</span>
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
                className={`flex flex-wrap items-center justify-between gap-3 border-t border-k-ghost px-5 py-4 transition-colors ${
                  reviewed[active] ? 'bg-k-success/[0.06]' : 'bg-[#181818]'
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
                    <span className="text-k-text-muted"> · exercícios, séries, cargas e descanso conferidos</span>
                  </span>
                </label>
                {active < plans.length - 1 && (
                  <button
                    type="button"
                    onClick={() => onSelect(active + 1)}
                    className="flex h-[38px] items-center gap-1.5 rounded-[10px] border border-white/10 bg-k-bg px-3.5 text-[13px] font-semibold transition-colors hover:border-white/20"
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
            className={`flex flex-col gap-[18px] rounded-[20px] border bg-k-surface1 p-6 transition-colors ${
              allReviewed && agreed ? 'border-k-primary/40' : 'border-k-ghost'
            }`}
          >
            <div className="flex items-start gap-3.5">
              <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-k-primary/[0.12] text-k-primary">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h3
                  id="ai-approval-title"
                  className="font-display text-lg font-extrabold tracking-tight font-stretch-semi-expanded"
                >
                  Aprovação profissional
                </h3>
                <p className={`mt-0.5 text-[13px] ${allReviewed ? 'text-k-success' : 'text-k-text-muted'}`}>
                  {progressText}
                </p>
              </div>
            </div>

            <div aria-hidden="true" className="flex gap-1.5">
              {reviewed.map((done, i) => (
                <span
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${done ? 'bg-k-success' : 'bg-white/10'}`}
                />
              ))}
            </div>

            <label
              className={`flex items-start gap-3.5 rounded-[14px] border border-white/10 bg-k-bg px-[18px] py-4 transition-opacity ${
                allReviewed ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
              }`}
            >
              <input
                type="checkbox"
                checked={agreed}
                onChange={onToggleAgreed}
                disabled={!allReviewed || approving}
                className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-k-primary disabled:cursor-not-allowed"
              />
              <span className="text-sm leading-relaxed text-k-text-soft">{declarationText(studentName)}</span>
            </label>

            <ul className="flex flex-col gap-2 text-[13px] leading-normal text-k-text-dim">
              <li className="flex gap-2.5">
                <UserRound className="mt-0.5 h-[15px] w-[15px] shrink-0 text-k-text-muted" />
                {plans.length === 1 ? 'A ficha aparece' : 'As fichas aparecem'} no app de {studentFirstName} como
                prescritas por você.
              </li>
              <li className="flex gap-2.5">
                <Clock className="mt-0.5 h-[15px] w-[15px] shrink-0 text-k-text-muted" />
                Registramos o seu aceite com data, hora, o seu pedido e a versão aprovada das fichas.
              </li>
              {currentPlanCount > 0 && (
                <li className="flex gap-2.5">
                  <RefreshCw className="mt-0.5 h-[15px] w-[15px] shrink-0 text-k-text-muted" />
                  {form.replace
                    ? `${currentPlanCount === 1 ? 'A ficha atual sai' : `As ${currentPlanCount} fichas atuais saem`} do app. O histórico de treinos continua nas estatísticas.`
                    : `${currentPlanCount === 1 ? 'A ficha atual continua' : `As ${currentPlanCount} fichas atuais continuam`} no app, junto com as novas.`}
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

            <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-white/[0.06] pt-[18px]">
              <button
                type="button"
                onClick={onDiscard}
                disabled={approving}
                className="h-[46px] rounded-xl border border-white/10 bg-k-bg px-[18px] text-sm font-semibold text-k-text-dim transition-colors hover:bg-k-surface2 hover:text-k-text disabled:opacity-50"
              >
                Descartar prévia
              </button>
              {approveButton('lg')}
            </div>
          </section>
        </div>

        <aside className="flex min-w-0 flex-[1_1_320px] flex-col gap-4">
          <section aria-labelledby="ai-request-title" className={`flex flex-col gap-3 p-5 ${CARD}`}>
            <div className="flex items-center justify-between gap-2.5">
              <h3 id="ai-request-title" className="font-display text-[15px] font-extrabold font-stretch-semi-expanded">
                Seu pedido
              </h3>
              <button
                type="button"
                onClick={onAdjust}
                className="flex items-center gap-1.5 text-[13px] font-semibold text-k-primary hover:underline"
              >
                <Pencil className="h-[13px] w-[13px]" />
                Ajustar pedido
              </button>
            </div>
            <p className="whitespace-pre-line rounded-xl bg-k-bg p-3.5 text-[13px] leading-relaxed text-k-text-soft">
              “{form.prompt.trim()}”
            </p>
            <p className="text-xs leading-normal text-k-text-muted">
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
                  className="font-display text-[15px] font-extrabold font-stretch-semi-expanded"
                >
                  Como a IA entendeu
                </h3>
                <p className="mt-0.5 text-[12.5px] text-k-text-muted">Confira se bate com o que você pediu.</p>
              </div>
              <ul className="flex flex-col gap-3">
                {understood.map((item) => (
                  <li key={item.title} className="flex gap-2.5">
                    <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-k-success/[0.14] text-k-success">
                      <Check className="h-3 w-3" strokeWidth={2.8} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-semibold">{item.title}</p>
                      {item.detail && <p className="mt-px text-[12.5px] text-k-text-muted">{item.detail}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <VolumeCard plans={plans} />
        </aside>
      </div>
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
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 pb-4 pt-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex h-[26px] items-center rounded-full border px-[11px] font-display text-xs font-extrabold tracking-wide font-stretch-semi-expanded ${accent.text} ${accent.bg} ${accent.ring}`}
            >
              {dayLabel(plan.input.tag, index)}
            </span>
            {plan.edited && (
              <span className="inline-flex h-[26px] items-center gap-1.5 rounded-full bg-k-primary/10 px-2.5 text-xs font-semibold text-k-primary">
                <Pencil className="h-3 w-3" />
                Editada por você
              </span>
            )}
          </div>
          <h3 className="mt-2.5 font-display text-[22px] font-extrabold uppercase tracking-tight font-stretch-semi-expanded">
            {plan.input.title}
          </h3>
          {subtitle && <p className="mt-1 text-[13px] text-k-text-dim">{subtitle}</p>}
          <p className="mt-1.5 text-[12.5px] tabular-nums text-k-text-muted">
            {planMeta(plan)} · {LEVELS.find((l) => l.value === (plan.input.level ?? level))?.label ?? plan.input.level}
          </p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="flex h-[38px] items-center gap-1.5 rounded-[10px] border border-k-primary/30 bg-k-primary/[0.08] px-3.5 text-[13px] font-semibold text-k-primary transition-colors hover:bg-k-primary/[0.16]"
        >
          <Pencil className="h-3.5 w-3.5" />
          Editar esta ficha
        </button>
      </div>

      <div className="overflow-x-auto">
        <div role="table" aria-label="Exercícios da ficha" className="min-w-[760px]">
          <div
            role="row"
            className={`${ROW_GRID} border-y border-k-ghost bg-[#181818] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-k-text-muted`}
          >
            <span role="columnheader">#</span>
            <span role="columnheader">Exercício</span>
            <span role="columnheader">Séries × reps</span>
            <span role="columnheader">Carga</span>
            <span role="columnheader">Descanso</span>
          </div>
          {groups.map((group) => (
            <div key={group.value} role="rowgroup" aria-label={group.label}>
              <div className="flex items-center gap-2 px-5 pb-1.5 pt-3.5 text-[11.5px] font-bold uppercase tracking-[0.06em] text-k-text-soft">
                <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: group.color }} />
                {group.label}
                <span className="font-medium normal-case tracking-normal text-k-text-muted">
                  · {group.items.length} {group.items.length === 1 ? 'exercício' : 'exercícios'}
                </span>
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
  return (
    <div
      role="row"
      className={`${ROW_GRID} items-baseline border-t border-white/[0.05] px-5 py-3 ${attention ? 'bg-k-warn/[0.05]' : ''}`}
    >
      <span
        role="cell"
        className="font-display text-[13px] font-extrabold tabular-nums text-k-text-muted font-stretch-semi-expanded"
      >
        {n}
      </span>
      <div role="cell" className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <span className="text-[14.5px] font-semibold">{ex.name}</span>
          {ex.muscles && (
            <span className="rounded-full bg-white/[0.06] px-[9px] py-0.5 text-[11.5px] font-semibold text-k-text-soft">
              {muscleLabel(ex.muscles)}
            </span>
          )}
          {ex.type && <span className="text-xs capitalize text-k-text-muted">{ex.type.toLowerCase()}</span>}
        </div>
        {ex.notes && <p className="text-[12.5px] leading-normal text-k-text-muted">{ex.notes}</p>}
        {attention && (
          <p className="mt-0.5 flex items-start gap-1.5 text-[12.5px] leading-normal text-k-warn">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {attention}
          </p>
        )}
      </div>
      <span role="cell" className="font-semibold tabular-nums">
        {ex.sets} × {ex.reps}
      </span>
      <span role="cell" className="text-k-text-soft">
        {ex.weight ?? '—'}
      </span>
      <span role="cell" className="tabular-nums text-k-text-muted">
        {ex.restTime ?? '—'}
      </span>
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
        <h3 id="ai-volume-title" className="font-display text-[15px] font-extrabold font-stretch-semi-expanded">
          Séries por grupo muscular
        </h3>
        <p className="mt-0.5 text-[12.5px] text-k-text-muted">
          {plans.length === 1 ? 'Da ficha' : `Soma das ${plans.length} fichas`}, sem mobilidade, core e cardio.
        </p>
      </div>
      <ul className="flex flex-col gap-[9px]">
        {rows.map((row) => (
          <li key={row.label} className="grid grid-cols-[88px_minmax(0,1fr)_24px] items-center gap-2.5 text-[12.5px]">
            <span className="text-k-text-soft">{row.label}</span>
            <span aria-hidden="true" className="h-2 overflow-hidden rounded bg-white/[0.05]">
              <span
                className="block h-full rounded bg-k-chart-2 transition-[width] duration-500"
                style={{ width: `${Math.round((row.value / max) * 100)}%` }}
              />
            </span>
            <span className="text-right font-semibold tabular-nums">{row.value}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
