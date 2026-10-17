import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Minus,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react';
import KineticSelect, { type KineticSelectOption } from '../../KineticSelect';
import { LEVELS } from '../workoutVocab';
import { LETTERS, joinPt, tagsFor, type AiRequestForm } from './aiDraft';
import type { AiPlanContext, WorkoutPlan } from '../../../types';

interface Props {
  studentFirstName: string;
  form: AiRequestForm;
  onChange: (changes: Partial<AiRequestForm>) => void;
  currentPlans: WorkoutPlan[];
  context: AiPlanContext | null;
  contextError: boolean;
  onRetryContext: () => void;
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
const LABEL = 'text-[11.5px] font-semibold uppercase tracking-[0.06em] text-k-text-muted';
const CARD = 'rounded-[20px] border border-k-ghost bg-k-surface1';

const nf1 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

export default function AiPlanComposer({
  studentFirstName,
  form,
  onChange,
  currentPlans,
  context,
  contextError,
  onRetryContext,
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

  const addChip = (label: string) => {
    const base = form.prompt.trim();
    const sep = base === '' ? '' : /[.!?]$/.test(base) ? ' ' : '. ';
    onChange({ prompt: `${base}${sep}${label}.`.slice(0, PROMPT_MAX) });
  };

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-20 border-b border-k-ghost bg-k-bg/85 backdrop-blur-[14px]">
        <div className="mx-auto flex w-full max-w-[1120px] flex-wrap items-center justify-between gap-3 px-8 py-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onExit}
              aria-label="Voltar para as fichas"
              className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-k-surface1 text-k-text-dim transition-colors hover:bg-k-surface2 hover:text-k-text"
            >
              <ArrowLeft className="h-[17px] w-[17px] transition-transform duration-300 group-hover:-translate-x-0.5" />
            </button>
            <div className="min-w-0">
              <h2 className="truncate font-display text-lg font-extrabold tracking-tight font-stretch-semi-expanded">
                Criar fichas com IA
              </h2>
              <p className="truncate text-[12.5px] text-k-text-muted">
                Para {studentFirstName} · <span className="text-k-warn">nada vai para o app sem a sua aprovação</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            {hasPreview && (
              <button
                type="button"
                onClick={onBackToPreview}
                className="h-10 rounded-xl border border-k-warn/30 bg-k-warn/[0.08] px-4 text-sm font-semibold text-k-warn transition-colors hover:bg-k-warn/[0.14]"
              >
                Voltar para a prévia
              </button>
            )}
            <button
              type="button"
              onClick={onExit}
              className="h-10 rounded-xl border border-white/10 bg-k-surface1 px-4 text-sm font-semibold text-k-text-dim transition-colors hover:bg-k-surface2 hover:text-k-text"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1120px] flex-wrap items-start gap-5 px-8 py-6">
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

          <section className={`flex flex-col gap-3.5 p-6 ${CARD}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <label
                htmlFor="ai-prompt"
                className="font-display text-base font-extrabold tracking-tight font-stretch-semi-expanded"
              >
                Descreva o treino que você quer
              </label>
              <span className="text-xs text-k-text-muted">Divisão, foco, o que evitar, tempo, equipamentos</span>
            </div>
            <textarea
              id="ai-prompt"
              value={form.prompt}
              onChange={(e) => onChange({ prompt: e.target.value.slice(0, PROMPT_MAX) })}
              maxLength={PROMPT_MAX}
              rows={6}
              autoFocus
              placeholder="Ex.: Divisão ABC de hipertrofia com foco em glúteos, sem impacto no joelho, treinos de até 50 minutos."
              className="min-h-[168px] w-full resize-y rounded-[14px] border border-white/10 bg-k-bg px-4 py-3.5 text-[15px] leading-relaxed outline-none transition-[border-color,box-shadow] placeholder:text-k-text-muted focus:border-k-primary focus:shadow-[0_0_0_3px_rgba(0,229,255,0.12)]"
            />
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-0.5 text-xs text-k-text-muted">Atalhos</span>
                {CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => addChip(chip)}
                    className="flex h-[30px] items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 text-[12.5px] font-semibold text-k-text-soft transition-colors hover:border-k-primary/40 hover:text-k-primary"
                  >
                    <Plus className="h-3 w-3" strokeWidth={2.6} />
                    {chip}
                  </button>
                ))}
              </div>
              <span className="text-xs tabular-nums text-k-text-muted">
                {form.prompt.length}/{PROMPT_MAX}
              </span>
            </div>
          </section>

          <section
            aria-label="Formato da geração"
            className={`grid gap-4 px-6 py-5 sm:grid-cols-2 xl:grid-cols-4 ${CARD}`}
          >
            <div className="flex min-w-0 flex-col gap-1.5">
              <span id="ai-scope-label" className={LABEL}>
                O que gerar
              </span>
              <div
                role="group"
                aria-labelledby="ai-scope-label"
                className="flex rounded-xl border border-k-ghost bg-k-bg p-[3px]"
              >
                <SegmentButton active={!full} onClick={() => onChange({ scope: 'one' })}>
                  Uma ficha
                </SegmentButton>
                <SegmentButton active={full} onClick={() => onChange({ scope: 'full' })}>
                  Divisão completa
                </SegmentButton>
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-1.5">
              <span className={LABEL}>Fichas</span>
              {full ? (
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center rounded-xl border border-white/10 bg-k-bg">
                    <button
                      type="button"
                      aria-label="Menos uma ficha"
                      onClick={() => onChange({ count: Math.max(COUNT_MIN, form.count - 1) })}
                      disabled={form.count <= COUNT_MIN}
                      className="flex h-10 w-10 items-center justify-center text-k-text-soft transition-colors hover:text-k-primary disabled:opacity-30"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-[22px] text-center font-display text-base font-extrabold tabular-nums">
                      {form.count}
                    </span>
                    <button
                      type="button"
                      aria-label="Mais uma ficha"
                      onClick={() => onChange({ count: Math.min(COUNT_MAX, form.count + 1) })}
                      disabled={form.count >= COUNT_MAX}
                      className="flex h-10 w-10 items-center justify-center text-k-text-soft transition-colors hover:text-k-primary disabled:opacity-30"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="text-[12.5px] text-k-text-muted">{joinPt(tags)}</span>
                </div>
              ) : (
                <p className="flex h-10 items-center text-[13px] text-k-text-soft">1 ficha · {tags[0] ?? `DIA ${LETTERS[0]}`}</p>
              )}
            </div>

            <div className="flex min-w-0 flex-col gap-1.5">
              <label htmlFor="ai-duration" className={LABEL}>
                Duração por treino (min)
              </label>
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
                className={`${INPUT} tabular-nums aria-[invalid=true]:border-k-alert/70`}
              />
              {durationInvalid && <p className="text-[12px] text-k-alert">Entre 15 e 240 min.</p>}
            </div>

            <div className="flex min-w-0 flex-col gap-1.5">
              <label htmlFor="ai-level" className={LABEL}>
                Nível do aluno
              </label>
              <KineticSelect
                id="ai-level"
                value={form.level}
                onChange={(v) => onChange({ level: v })}
                options={LEVEL_OPTIONS}
              />
            </div>
          </section>

          {currentPlans.length > 0 && (
            <fieldset className={`m-0 flex min-w-0 flex-col gap-2.5 px-6 py-5 ${CARD}`}>
              <legend className="float-left mb-1 w-full font-display text-[15px] font-extrabold font-stretch-semi-expanded">
                {studentFirstName} já tem {currentPlans.length} {currentPlans.length === 1 ? 'ficha' : 'fichas'} no app
              </legend>
              <RadioCard
                checked={form.replace}
                onSelect={() => onChange({ replace: true })}
                title="Substituir as fichas atuais"
                detail="Elas saem do app quando você aprovar. O histórico de treinos continua nas estatísticas."
              />
              <RadioCard
                checked={!form.replace}
                onSelect={() => onChange({ replace: false })}
                title="Manter e adicionar as novas"
                detail={`As fichas atuais continuam. As novas entram como ${joinPt(tags)}.`}
              />
            </fieldset>
          )}

          <div className="flex flex-wrap items-center gap-x-5 gap-y-3.5 pt-1">
            <motion.button
              type="button"
              onClick={onGenerate}
              disabled={!canGenerate || durationInvalid}
              whileTap={{ scale: 0.97 }}
              className="flex h-12 items-center gap-2.5 rounded-[14px] bg-k-primary px-6 text-[15px] font-bold text-k-on-primary transition-[box-shadow,opacity] hover:shadow-[0_0_0_4px_rgba(0,229,255,0.14),0_12px_28px_-12px_rgba(0,229,255,0.8)] disabled:pointer-events-none disabled:bg-k-surface2 disabled:text-k-text-muted"
            >
              <Sparkles className="h-[17px] w-[17px]" />
              {canGenerate ? (hasPreview ? 'Gerar nova prévia' : 'Gerar prévia') : 'Descreva o treino para gerar'}
            </motion.button>
            <p className="min-w-[240px] flex-1 text-[13px] leading-relaxed text-k-text-muted">
              A IA monta uma prévia. Você revisa cada ficha e só depois do seu aceite o treino aparece no app de{' '}
              {studentFirstName}.
            </p>
          </div>
        </div>

        <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
          <ContextCard
            studentFirstName={studentFirstName}
            context={context}
            error={contextError}
            onRetry={onRetryContext}
          />

          <section aria-labelledby="ai-how-title" className={`flex flex-col gap-3.5 p-5 ${CARD}`}>
            <h3
              id="ai-how-title"
              className="font-display text-[15px] font-extrabold font-stretch-semi-expanded"
            >
              Como funciona
            </h3>
            <ol className="flex flex-col gap-3.5">
              <Step n={1} title="Você descreve o treino" detail="A ideia, a divisão e o que evitar." />
              <Step n={2} title="A IA monta a prévia" detail="Fichas completas, com séries, cargas e descanso." />
              <li className="flex gap-3">
                <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-k-primary/[0.14] text-k-primary">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="font-semibold text-k-primary">Você revisa e aprova</p>
                  <p className="mt-0.5 text-[12.5px] text-k-text-muted">
                    Só depois do seu aceite o treino aparece no app, prescrito por você.
                  </p>
                </div>
              </li>
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
}

function SegmentButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`h-9 flex-1 rounded-[9px] px-2 text-[13px] font-semibold transition-colors ${
        active
          ? 'bg-k-primary/[0.12] text-k-primary shadow-[inset_0_0_0_1px_rgba(0,229,255,0.28)]'
          : 'text-k-text-muted hover:text-k-text'
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
      className={`flex cursor-pointer items-start gap-3 rounded-[14px] border px-3.5 py-3 transition-colors ${
        checked ? 'border-k-primary/35 bg-k-primary/[0.05]' : 'border-k-ghost hover:border-white/15'
      }`}
    >
      <input
        type="radio"
        name="ai-current-plans"
        checked={checked}
        onChange={onSelect}
        className="mt-0.5 h-[18px] w-[18px] shrink-0 accent-k-primary"
      />
      <span className="flex flex-col gap-0.5">
        <span className="font-semibold">{title}</span>
        <span className="text-[12.5px] text-k-text-muted">{detail}</span>
      </span>
    </label>
  );
}

function Step({ n, title, detail }: { n: number; title: string; detail: string }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-k-surface2 font-display text-xs font-extrabold text-k-text-soft">
        {n}
      </span>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-0.5 text-[12.5px] text-k-text-muted">{detail}</p>
      </div>
    </li>
  );
}

function ContextCard({
  studentFirstName,
  context,
  error,
  onRetry,
}: {
  studentFirstName: string;
  context: AiPlanContext | null;
  error: boolean;
  onRetry: () => void;
}) {
  const rows: [string, string][] = context
    ? [
        ['Objetivo', context.goal ?? 'Não informado'],
        ['Nível', LEVELS.find((l) => l.value === context.level)?.label ?? context.level],
        ['Idade', context.age != null ? `${context.age} anos` : 'Não informada'],
        [
          'Peso · altura',
          `${context.weightKg != null ? `${nf1.format(context.weightKg)} kg` : '—'} · ${
            context.heightCm != null ? `${nf1.format(context.heightCm / 100)} m` : '—'
          }`,
        ],
        ['Frequência', context.frequency != null ? `${context.frequency}x por semana` : 'Não informada'],
      ]
    : [];

  return (
    <section aria-labelledby="ai-context-title" className={`flex flex-col gap-3.5 p-5 ${CARD}`}>
      <div className="flex items-center gap-2.5">
        <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-k-primary/10 text-k-primary">
          <UserRound className="h-[17px] w-[17px]" />
        </span>
        <h3 id="ai-context-title" className="font-display text-[15px] font-extrabold font-stretch-semi-expanded">
          O que a IA vai considerar
        </h3>
      </div>

      {error ? (
        <div className="flex flex-col items-start gap-2.5 text-[13px] text-k-text-muted">
          <p>Não foi possível carregar o perfil de {studentFirstName}. A IA usa só o seu pedido até ele carregar.</p>
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-1.5 font-semibold text-k-primary hover:underline"
          >
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
          <dl className="grid grid-cols-[auto_1fr] gap-x-3.5 gap-y-2 text-[13px]">
            {rows.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-k-text-muted">{label}</dt>
                <dd className="text-right font-semibold tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
          {context.medicalConditions ? (
            <div className="flex items-start gap-2.5 rounded-xl border border-k-warn/20 bg-k-warn/[0.08] p-3 text-[13px] leading-normal">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-k-warn" />
              <div>
                <p className="font-semibold text-k-warn">Restrição informada</p>
                <p className="mt-0.5 text-k-text-soft">{context.medicalConditions}</p>
              </div>
            </div>
          ) : (
            <p className="rounded-xl bg-white/[0.04] px-3 py-2.5 text-[13px] text-k-text-muted">
              Nenhuma restrição médica informada.
            </p>
          )}
          <p className="text-xs leading-relaxed text-k-text-muted">
            Vem da anamnese que {studentFirstName} preencheu no app. Esses dados vão para o Gemini junto com o seu
            pedido.
          </p>
        </>
      )}
    </section>
  );
}
