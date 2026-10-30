import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, AlertTriangle, Minus, Pencil, Plus, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import KineticSelect, { type KineticSelectOption } from '../../KineticSelect';
import { ProtocolDialog, goalLabel, useStudentProtocol } from '../StudentProtocol';
import { LEVELS } from '../workoutVocab';
import { bareTag, joinPt, tagsFor, type AiRequestForm } from './aiDraft';
import AiFlowHeader, { AiFlowFooter } from './AiFlowHeader';
import type { AiPlanContext, WorkoutPlan } from '../../../types';

interface Props {
  studentId: string;
  studentFirstName: string;
  form: AiRequestForm;
  onChange: (changes: Partial<AiRequestForm>) => void;
  currentPlans: WorkoutPlan[];
  context: AiPlanContext | null;
  contextError: boolean;
  onRetryContext: () => void;
  /** O personal alterou o protocolo do aluno por aqui: o contexto da IA precisa recarregar. */
  onProtocolSaved: () => void;
  /** Erro da última geração, exibido no topo. */
  error: string | null;
  /** Há uma prévia gerada: o personal pode voltar a ela sem gerar de novo. */
  hasPreview: boolean;
  onBackToPreview: () => void;
  onGenerate: () => void;
  onExit: () => void;
}

export const PROMPT_MAX = 1000;
export const PROMPT_MIN = 10;
const COUNT_MIN = 2;
const COUNT_MAX = 6;

const CHIPS = ['Divisão ABC', 'Hipertrofia', 'Upper/Lower', 'Full body', 'Baixo impacto', 'Só máquinas', 'Treino em casa', 'Core no final'];

const LEVEL_OPTIONS: KineticSelectOption[] = LEVELS.map((l) => ({ value: l.value, label: l.label }));

const INPUT =
  'h-10 w-full min-w-0 rounded-[10px] border border-white/10 bg-k-bg px-3 text-sm outline-none transition-[border-color,box-shadow] placeholder:text-k-text-muted focus:border-k-primary focus:shadow-[0_0_0_3px_rgba(0,229,255,0.12)]';
const LABEL = 'text-[11px] font-semibold uppercase tracking-[0.07em] text-k-text-muted';
const CARD = 'rounded-2xl border border-k-ghost bg-k-surface1';
const SECTION_TITLE = 'font-display text-[15px] font-bold font-stretch-semi-expanded';

const nf1 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });

const levelLabel = (value: string) => LEVELS.find((l) => l.value === value)?.label ?? value;

export default function AiPlanComposer({
  studentId,
  studentFirstName,
  form,
  onChange,
  currentPlans,
  context,
  contextError,
  onRetryContext,
  onProtocolSaved,
  error,
  hasPreview,
  onBackToPreview,
  onGenerate,
  onExit,
}: Props) {
  const full = form.scope === 'full';
  const count = full ? form.count : 1;
  const tags = tagsFor(count, form.replace, currentPlans).map((l) => `DIA ${l}`);
  const promptLength = form.prompt.trim().length;
  const canGenerate = promptLength >= PROMPT_MIN;
  const duration = Number(form.duration);
  const durationInvalid = form.duration.trim() !== '' && (!Number.isInteger(duration) || duration < 15 || duration > 240);
  const hasCurrent = currentPlans.length > 0;

  const addChip = (label: string) => {
    const base = form.prompt.trim();
    const sep = base === '' ? '' : /[.!?]$/.test(base) ? ' ' : '. ';
    onChange({ prompt: `${base}${sep}${label}.`.slice(0, PROMPT_MAX) });
  };

  const summary = [
    `${count} ${count === 1 ? 'ficha' : 'fichas'}`,
    tags.length > 1 ? `${tags[0]}–${bareTag(tags[tags.length - 1])}` : tags[0],
    form.duration.trim() && !durationInvalid ? `${form.duration.trim()} min` : null,
    levelLabel(form.level),
    hasCurrent ? (form.replace ? `substitui as ${currentPlans.length} atuais` : `mantém as ${currentPlans.length} atuais`) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="flex min-h-full flex-col">
      <AiFlowHeader
        step={1}
        studentFirstName={studentFirstName}
        onBack={onExit}
        backLabel="Voltar para as fichas"
        actions={
          hasPreview ? (
            <button
              type="button"
              onClick={onBackToPreview}
              className="h-10 rounded-[10px] border border-white/10 bg-k-surface1 px-4 text-sm font-semibold text-k-text transition-colors hover:bg-k-surface2"
            >
              Voltar para a prévia
            </button>
          ) : undefined
        }
      />

      <div className="mx-auto flex w-full max-w-[1120px] flex-1 flex-wrap items-start gap-5 px-4 md:px-8 py-7">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-4">
          <AnimatePresence>
            {error && (
              <motion.div
                key="error"
                role="alert"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-2.5 rounded-xl border border-k-alert/25 bg-k-alert/[0.08] px-4 py-3 text-[13px] leading-snug text-k-alert"
              >
                <AlertCircle className="mt-px h-4 w-4 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <section aria-label="Pedido" className={CARD}>
            <div className="flex flex-col gap-3 p-4 sm:p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <label htmlFor="ai-prompt" className={SECTION_TITLE}>
                  O que você quer para {studentFirstName}?
                </label>
                <span className="text-xs text-k-text-muted">Divisão, foco, o que evitar, equipamentos</span>
              </div>
              <textarea
                id="ai-prompt"
                value={form.prompt}
                onChange={(e) => onChange({ prompt: e.target.value.slice(0, PROMPT_MAX) })}
                maxLength={PROMPT_MAX}
                rows={4}
                autoFocus
                placeholder="Ex.: Divisão ABC de hipertrofia com foco em glúteos, sem impacto no joelho, treinos de até 50 minutos."
                className="min-h-[120px] w-full resize-y rounded-[10px] border border-white/10 bg-k-bg px-3.5 py-3 text-sm leading-relaxed outline-none transition-[border-color,box-shadow] placeholder:text-k-text-muted focus:border-k-primary focus:shadow-[0_0_0_3px_rgba(0,229,255,0.12)]"
              />
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="mr-1 text-xs text-k-text-muted">Sugestões</span>
                  {CHIPS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => addChip(chip)}
                      className="h-7 rounded-lg border border-white/10 px-2.5 text-[12.5px] font-medium text-k-text-soft transition-colors hover:bg-k-surface2 hover:text-k-text"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
                <span className="font-mono text-[11.5px] tabular-nums text-k-text-muted">
                  {form.prompt.length} / {PROMPT_MAX}
                </span>
              </div>
            </div>

            <div className="grid gap-4 border-t border-k-ghost px-4 py-5 sm:grid-cols-2 sm:px-6 xl:grid-cols-4">
              <div className="flex min-w-0 flex-col gap-2">
                <span id="ai-scope-label" className={LABEL}>
                  Formato
                </span>
                <div
                  role="group"
                  aria-labelledby="ai-scope-label"
                  className="flex h-10 rounded-[10px] border border-white/10 bg-k-bg p-[3px]"
                >
                  <SegmentButton active={!full} onClick={() => onChange({ scope: 'one' })}>
                    Ficha única
                  </SegmentButton>
                  <SegmentButton active={full} onClick={() => onChange({ scope: 'full' })}>
                    Divisão
                  </SegmentButton>
                </div>
              </div>

              <div className="flex min-w-0 flex-col gap-2">
                <span className={LABEL}>Fichas</span>
                {full ? (
                  <>
                    <div className="flex h-10 items-center rounded-[10px] border border-white/10 bg-k-bg">
                      <button
                        type="button"
                        aria-label="Menos uma ficha"
                        onClick={() => onChange({ count: Math.max(COUNT_MIN, form.count - 1) })}
                        disabled={form.count <= COUNT_MIN}
                        className="flex h-full w-10 items-center justify-center text-k-text-dim transition-colors hover:text-k-text disabled:opacity-30"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="flex-1 text-center font-mono text-sm font-semibold tabular-nums">{form.count}</span>
                      <button
                        type="button"
                        aria-label="Mais uma ficha"
                        onClick={() => onChange({ count: Math.min(COUNT_MAX, form.count + 1) })}
                        disabled={form.count >= COUNT_MAX}
                        className="flex h-full w-10 items-center justify-center text-k-text-dim transition-colors hover:text-k-text disabled:opacity-30"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <span className="text-xs text-k-text-muted">Entram como {joinPt(tags)}</span>
                  </>
                ) : (
                  <p className="flex h-10 items-center text-[13px] text-k-text-soft">1 ficha · {tags[0]}</p>
                )}
              </div>

              <div className="flex min-w-0 flex-col gap-2">
                <label htmlFor="ai-duration" className={LABEL}>
                  Duração por treino
                </label>
                <div className="relative">
                  <input
                    id="ai-duration"
                    type="number"
                    inputMode="numeric"
                    min={15}
                    max={240}
                    value={form.duration}
                    onChange={(e) => onChange({ duration: e.target.value })}
                    placeholder="Livre"
                    aria-invalid={durationInvalid}
                    className={`${INPUT} pr-12 font-mono tabular-nums aria-[invalid=true]:border-k-alert/70`}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12.5px] text-k-text-muted">
                    min
                  </span>
                </div>
                {durationInvalid && <p className="text-[12px] text-k-alert">Entre 15 e 240 min.</p>}
              </div>

              <div className="flex min-w-0 flex-col gap-2">
                <label htmlFor="ai-level" className={LABEL}>
                  Nível
                </label>
                <KineticSelect id="ai-level" value={form.level} onChange={(v) => onChange({ level: v })} options={LEVEL_OPTIONS} />
                {context && context.level === form.level && <span className="text-xs text-k-text-muted">Do perfil do aluno</span>}
              </div>
            </div>

            {hasCurrent && (
              <fieldset className="m-0 flex min-w-0 flex-col gap-3 border-0 border-t border-solid border-k-ghost px-4 pb-6 pt-5 sm:px-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <legend className={`float-left ${SECTION_TITLE}`}>Fichas atuais de {studentFirstName}</legend>
                  <span className="flex flex-wrap gap-1.5">
                    {currentPlans.map((p) => (
                      <span key={p.id} className="rounded-md bg-k-surface2 px-[7px] py-[3px] font-mono text-[11px] text-k-text-soft">
                        DIA {bareTag(p.tag) || '?'}
                      </span>
                    ))}
                  </span>
                </div>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <RadioCard
                    checked={!form.replace}
                    onSelect={() => onChange({ replace: false })}
                    title="Manter e adicionar"
                    detail={`${currentPlans.length === 1 ? 'A ficha atual continua' : `As ${currentPlans.length} fichas continuam`}. As novas entram como ${joinPt(tags)}.`}
                  />
                  <RadioCard
                    checked={form.replace}
                    onSelect={() => onChange({ replace: true })}
                    title="Substituir as atuais"
                    detail="Saem do app quando você aprovar. O histórico continua nas estatísticas."
                  />
                </div>
              </fieldset>
            )}
          </section>
        </div>

        <aside className="flex min-w-0 flex-[1_1_280px] flex-col gap-4">
          <ContextCard
            studentId={studentId}
            studentFirstName={studentFirstName}
            context={context}
            error={contextError}
            onRetry={onRetryContext}
            onProtocolSaved={onProtocolSaved}
          />
        </aside>
      </div>

      <AiFlowFooter
        summary={
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[13px] text-k-text-soft">{summary}</span>
            <span className="flex items-center gap-1.5 text-xs text-k-text-muted">
              <ShieldCheck className="h-3.5 w-3.5" />
              Nada vai para o app de {studentFirstName} sem a sua aprovação
            </span>
          </div>
        }
      >
        <button
          type="button"
          onClick={onExit}
          className="h-11 rounded-[10px] border border-white/10 px-[18px] text-sm font-semibold text-k-text-soft transition-colors hover:bg-k-surface2 hover:text-k-text"
        >
          Cancelar
        </button>
        <motion.button
          type="button"
          onClick={onGenerate}
          disabled={!canGenerate || durationInvalid}
          whileTap={{ scale: 0.97 }}
          title={canGenerate ? undefined : 'Descreva o treino para gerar'}
          className="flex h-11 items-center gap-2 rounded-[10px] bg-k-primary px-5 text-sm font-bold text-k-on-primary transition-[box-shadow,opacity] hover:shadow-[0_0_0_4px_rgba(0,229,255,0.14)] disabled:pointer-events-none disabled:bg-k-surface2 disabled:text-k-text-muted"
        >
          <Sparkles className="h-4 w-4" />
          {hasPreview ? 'Gerar nova prévia' : 'Gerar prévia'}
        </motion.button>
      </AiFlowFooter>
    </div>
  );
}

export function SegmentButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`flex-1 rounded-[7px] px-2 text-[13px] transition-colors ${
        active ? 'bg-k-surface2 font-semibold text-k-text' : 'font-medium text-k-text-dim hover:text-k-text'
      }`}
    >
      {children}
    </button>
  );
}

function RadioCard({
  checked,
  onSelect,
  title,
  detail,
}: {
  checked: boolean;
  onSelect: () => void;
  title: string;
  detail: string;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3.5 transition-colors ${
        checked ? 'border-k-primary/45 bg-k-primary/[0.05]' : 'border-white/10 hover:border-white/15'
      }`}
    >
      <input
        type="radio"
        name="ai-current-plans"
        checked={checked}
        onChange={onSelect}
        className="mt-0.5 h-4 w-4 shrink-0 accent-k-primary"
      />
      <span className="flex flex-col gap-0.5">
        <span className="text-[13.5px] font-semibold">{title}</span>
        <span className="text-[12.5px] leading-normal text-k-text-dim">{detail}</span>
      </span>
    </label>
  );
}

function ContextCard({
  studentId,
  studentFirstName,
  context,
  error,
  onRetry,
  onProtocolSaved,
}: {
  studentId: string;
  studentFirstName: string;
  context: AiPlanContext | null;
  error: boolean;
  onRetry: () => void;
  onProtocolSaved: () => void;
}) {
  const protocolQ = useStudentProtocol(studentId);
  const [editing, setEditing] = useState(false);
  const p = protocolQ.data;
  const goalOrigin = p?.protocolUpdatedAt
    ? p.protocolUpdatedByStudent
      ? `Definido por ${studentFirstName} no app`
      : 'Definido por você'
    : null;

  const rows: [string, string][] = context
    ? [
        ['Nível', levelLabel(context.level)],
        ['Frequência', context.frequency != null ? `${context.frequency}x por semana` : 'Não informada'],
        ['Idade', context.age != null ? `${context.age} anos` : 'Não informada'],
        [
          'Peso · altura',
          `${context.weightKg != null ? `${nf1.format(context.weightKg)} kg` : '—'} · ${
            context.heightCm != null ? `${nf1.format(context.heightCm / 100)} m` : '—'
          }`,
        ],
      ]
    : [];

  return (
    <section aria-labelledby="ai-context-title" className={`flex flex-col gap-3.5 p-5 ${CARD}`}>
      <div className="flex items-center justify-between gap-2">
        <h3 id="ai-context-title" className={SECTION_TITLE}>
          Perfil considerado
        </h3>
        <span className={LABEL}>Anamnese</span>
      </div>

      {error ? (
        <div className="flex flex-col items-start gap-2.5 text-[13px] text-k-text-muted">
          <p>Não foi possível carregar o perfil de {studentFirstName}. A IA usa só o seu pedido até ele carregar.</p>
          <button type="button" onClick={onRetry} className="flex items-center gap-1.5 font-semibold text-k-primary hover:underline">
            <RefreshCw className="h-3.5 w-3.5" />
            Tentar de novo
          </button>
        </div>
      ) : !context ? (
        <div role="status" aria-label="Carregando perfil do aluno" className="flex flex-col gap-2.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="k-skeleton h-3.5 rounded-full bg-k-surface2" style={{ width: `${88 - i * 9}%` }} />
          ))}
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-1 rounded-xl border border-k-ghost bg-k-bg px-3.5 py-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-k-text-muted">Objetivo</span>
              <button
                type="button"
                onClick={() => setEditing(true)}
                disabled={!p}
                className="flex h-7 items-center gap-1.5 rounded-md px-2 text-[12.5px] font-semibold text-k-primary transition-colors hover:bg-k-primary/[0.08] disabled:opacity-40"
              >
                <Pencil className="h-3 w-3" />
                Alterar
              </button>
            </div>
            <span className="text-[15px] font-semibold">{goalLabel(context.goal)}</span>
            {goalOrigin && <span className="text-[11.5px] text-k-text-muted">{goalOrigin}</span>}
          </div>

          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 text-[13px]">
            {rows.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-k-text-muted">{label}</dt>
                <dd className="text-right font-semibold tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>

          {context.medicalConditions ? (
            <div className="flex items-start gap-2.5 rounded-xl border border-k-warn/20 bg-k-warn/[0.07] px-3.5 py-3 text-[13px] leading-normal">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-k-warn" />
              <div>
                <p className="text-[12.5px] font-semibold text-k-warn">Restrição informada</p>
                <p className="mt-0.5 text-k-text-soft">{context.medicalConditions}</p>
              </div>
            </div>
          ) : (
            <p className="rounded-xl bg-white/[0.04] px-3 py-2.5 text-[13px] text-k-text-muted">
              Nenhuma restrição médica informada.
            </p>
          )}
          <p className="text-xs leading-relaxed text-k-text-muted">
            Esses dados vão para a IA junto com o seu pedido. Mudou o objetivo ou a anamnese de {studentFirstName}?
            Atualize antes de gerar.
          </p>
        </>
      )}

      <ProtocolDialog
        open={editing}
        studentId={studentId}
        studentFirstName={studentFirstName}
        protocol={p}
        onClose={() => setEditing(false)}
        onSaved={onProtocolSaved}
      />
    </section>
  );
}
