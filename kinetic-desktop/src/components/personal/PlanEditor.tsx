import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, Reorder, motion, useDragControls } from 'motion/react';
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  GripVertical,
  Info,
  Plus,
  Save,
  Sparkles,
  StickyNote,
  Trash2,
} from 'lucide-react';
import { createStudentPlan, updateStudentPlan } from '../../services/trainerService';
import KineticSelect, { type KineticSelectOption } from '../KineticSelect';
import { EASE_OUT } from '../motion/primitives';
import ConfirmDialog from './ConfirmDialog';
import {
  LEVELS,
  LIMITS,
  MUSCLE_GROUPS,
  SECTIONS,
  heuristicDurationMinutes,
  muscleLabel,
} from './workoutVocab';
import type { ExerciseSection, WorkoutPlan, WorkoutPlanInput } from '../../types';

export type EditorMode =
  | { kind: 'create'; suggestedTag: string; source?: WorkoutPlan }
  | { kind: 'edit'; plan: WorkoutPlan }
  /** Ficha da prévia da IA: salvar devolve o conteúdo para a prévia, sem chamar a API. */
  | { kind: 'draft'; input: WorkoutPlanInput };

interface Props {
  studentId: string;
  studentFirstName: string;
  mode: EditorMode;
  onCancel: () => void;
  onSaved?: (plan: WorkoutPlan, created: boolean) => void;
  /** Obrigatório no modo 'draft'. */
  onDraftSaved?: (input: WorkoutPlanInput) => void;
}

// ─── Rascunho ────────────────────────────────────────────────────────────────
// Os campos ficam como texto enquanto o personal digita; a conversão para o
// formato da API acontece só no salvar (toInput).

interface DraftExercise {
  /** Chave local (React/Reorder). Exercícios novos não têm `id` ainda. */
  key: string;
  id?: string;
  name: string;
  muscles: string;
  type: string;
  sets: string;
  reps: string;
  weight: string;
  restTime: string;
  section: ExerciseSection;
  notes: string;
  showNotes: boolean;
}

interface Draft {
  title: string;
  subtitle: string;
  tag: string;
  level: string;
  duration: string;
  exercises: DraftExercise[];
}

type ExerciseField = 'name' | 'sets' | 'reps' | 'weight' | 'restTime' | 'type' | 'notes';

interface Errors {
  title?: string;
  tag?: string;
  subtitle?: string;
  duration?: string;
  list?: string;
  exercises: Record<string, Partial<Record<ExerciseField, string>>>;
  count: number;
}

let keySeq = 0;
const newKey = () => `ex-${++keySeq}`;

const blankExercise = (section: ExerciseSection = 'PRINCIPAL'): DraftExercise => ({
  key: newKey(),
  name: '',
  muscles: '',
  type: '',
  sets: '3',
  reps: '',
  weight: '',
  restTime: '',
  section,
  notes: '',
  showNotes: false,
});

const toSection = (value: string | null): ExerciseSection => {
  const upper = (value ?? '').toUpperCase();
  return SECTIONS.find((s) => s.value === upper)?.value ?? 'PRINCIPAL';
};

/** Aviso que a IA acrescenta ao subtítulo; deixa de ser verdade quando o personal assume a ficha. */
const AI_DISCLAIMER = /\s*·?\s*Sugestão IA\b.*$/i;

/** Mesmo subtítulo automático do backend (TrainerPlanService.subtitleFromMuscles). */
const autoSubtitle = (muscles: (string | null)[]) =>
  Array.from(new Set(muscles.map((m) => (m ?? '').trim().toUpperCase()).filter(Boolean)))
    .join(' / ')
    .slice(0, LIMITS.subtitle);

function draftFromPlan(plan: WorkoutPlan, keepIds: boolean): Draft {
  // A API devolve duração e subtítulo já resolvidos (estimativa/grupos musculares quando
  // ninguém definiu). Valor igual ao automático volta como vazio: se viesse preenchido,
  // salvar o congelaria e ele deixaria de acompanhar os exercícios.
  const totalSets = plan.data.reduce((sum, e) => sum + (e.sets ?? 0), 0);
  const duration = plan.estimatedDurationMinutes;
  const subtitle = (plan.subtitle ?? '').replace(AI_DISCLAIMER, '');
  return {
    title: plan.title ?? '',
    subtitle: subtitle === autoSubtitle(plan.data.map((e) => e.muscles)) ? '' : subtitle,
    tag: plan.tag ?? '',
    level: plan.level ?? '',
    duration: duration != null && duration !== heuristicDurationMinutes(totalSets) ? String(duration) : '',
    exercises: plan.data.map((e) => ({
      key: newKey(),
      id: keepIds ? e.id : undefined,
      name: e.name ?? '',
      muscles: (e.muscles ?? '').toUpperCase(),
      type: e.type ?? '',
      sets: e.sets != null ? String(e.sets) : '',
      reps: e.reps ?? '',
      weight: e.weight ?? '',
      restTime: e.restTime ?? '',
      section: toSection(e.section),
      notes: e.notes ?? '',
      showNotes: !!e.notes,
    })),
  };
}

function draftFromInput(input: WorkoutPlanInput): Draft {
  return {
    title: input.title,
    subtitle: input.subtitle ?? '',
    tag: input.tag ?? '',
    level: input.level ?? '',
    duration: input.estimatedDurationMinutes != null ? String(input.estimatedDurationMinutes) : '',
    exercises: input.exercises.map((e) => ({
      key: newKey(),
      name: e.name,
      muscles: (e.muscles ?? '').toUpperCase(),
      type: e.type ?? '',
      sets: String(e.sets),
      reps: e.reps,
      weight: e.weight ?? '',
      restTime: e.restTime ?? '',
      section: toSection(e.section),
      notes: e.notes ?? '',
      showNotes: !!e.notes,
    })),
  };
}

function initialDraft(mode: EditorMode): Draft {
  if (mode.kind === 'draft') return draftFromInput(mode.input);
  if (mode.kind === 'edit') return draftFromPlan(mode.plan, true);
  if (mode.source) {
    const copy = draftFromPlan(mode.source, false);
    return { ...copy, title: `${copy.title} (cópia)`.slice(0, LIMITS.title), tag: mode.suggestedTag };
  }
  return { title: '', subtitle: '', tag: mode.suggestedTag, level: '', duration: '', exercises: [blankExercise()] };
}

/** Assinatura do conteúdo (sem chaves locais) para saber se há alterações. */
const signature = (d: Draft) =>
  JSON.stringify({ ...d, exercises: d.exercises.map(({ key: _k, showNotes: _s, ...rest }) => rest) });

const isInt = (v: string) => /^\d+$/.test(v.trim());

function validate(d: Draft): Errors {
  const errors: Errors = { exercises: {}, count: 0 };
  const fail = () => errors.count++;

  if (!d.title.trim()) (errors.title = 'Dê um nome para a ficha.'), fail();
  else if (d.title.trim().length > LIMITS.title) (errors.title = `Até ${LIMITS.title} caracteres.`), fail();
  if (d.tag.trim().length > LIMITS.tag) (errors.tag = `Até ${LIMITS.tag} caracteres.`), fail();
  if (d.subtitle.trim().length > LIMITS.subtitle) (errors.subtitle = `Até ${LIMITS.subtitle} caracteres.`), fail();
  if (d.duration.trim()) {
    const n = Number(d.duration);
    if (!isInt(d.duration) || n < LIMITS.durationMin || n > LIMITS.durationMax) {
      errors.duration = `Entre ${LIMITS.durationMin} e ${LIMITS.durationMax} min.`;
      fail();
    }
  }
  if (d.exercises.length === 0) (errors.list = 'Adicione pelo menos um exercício.'), fail();
  if (d.exercises.length > LIMITS.exercises) (errors.list = `Máximo de ${LIMITS.exercises} exercícios.`), fail();

  for (const ex of d.exercises) {
    const e: Partial<Record<ExerciseField, string>> = {};
    if (!ex.name.trim()) e.name = 'Informe o exercício.';
    else if (ex.name.trim().length > LIMITS.name) e.name = `Até ${LIMITS.name} caracteres.`;
    const sets = Number(ex.sets);
    if (!isInt(ex.sets) || sets < LIMITS.setsMin || sets > LIMITS.setsMax) e.sets = `${LIMITS.setsMin} a ${LIMITS.setsMax}`;
    if (!ex.reps.trim()) e.reps = 'Obrigatório';
    else if (ex.reps.trim().length > LIMITS.reps) e.reps = `Até ${LIMITS.reps}`;
    if (ex.weight.trim().length > LIMITS.weight) e.weight = `Até ${LIMITS.weight}`;
    if (ex.restTime.trim().length > LIMITS.restTime) e.restTime = `Até ${LIMITS.restTime}`;
    if (ex.type.trim().length > LIMITS.type) e.type = `Até ${LIMITS.type}`;
    if (ex.notes.trim().length > LIMITS.notes) e.notes = `Até ${LIMITS.notes} caracteres.`;
    const n = Object.keys(e).length;
    if (n > 0) {
      errors.exercises[ex.key] = e;
      errors.count += n;
    }
  }
  return errors;
}

const orNull = (v: string) => (v.trim() ? v.trim() : null);

function toInput(d: Draft): WorkoutPlanInput {
  return {
    title: d.title.trim(),
    subtitle: orNull(d.subtitle),
    tag: orNull(d.tag),
    level: orNull(d.level),
    estimatedDurationMinutes: d.duration.trim() ? Number(d.duration) : null,
    exercises: d.exercises.map((ex) => ({
      ...(ex.id ? { id: ex.id } : {}),
      name: ex.name.trim(),
      muscles: orNull(ex.muscles),
      type: orNull(ex.type),
      sets: Number(ex.sets),
      reps: ex.reps.trim(),
      weight: orNull(ex.weight),
      restTime: orNull(ex.restTime),
      section: ex.section,
      notes: orNull(ex.notes),
    })),
  };
}

// ─── Opções dos seletores ────────────────────────────────────────────────────

const LEVEL_OPTIONS: KineticSelectOption[] = [{ value: '', label: 'Nível do aluno', muted: true }, ...LEVELS];
const MUSCLE_OPTIONS: KineticSelectOption[] = [{ value: '', label: 'Nenhum', muted: true }, ...MUSCLE_GROUPS];
const SECTION_OPTIONS: KineticSelectOption[] = SECTIONS.map((s) => ({ value: s.value, label: s.label, dot: s.color }));

// ─── Estilos compartilhados ──────────────────────────────────────────────────

const INPUT =
  'h-10 w-full min-w-0 rounded-[10px] border border-white/10 bg-k-bg px-3 text-sm outline-none transition-[border-color,box-shadow] placeholder:text-k-text-muted focus:border-k-primary focus:shadow-[0_0_0_3px_rgba(0,229,255,0.12)] aria-[invalid=true]:border-k-alert/70';
const ICON_BTN =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-k-text-muted transition-colors hover:bg-white/[0.06] hover:text-k-text disabled:pointer-events-none disabled:opacity-30';

// ─── Editor ──────────────────────────────────────────────────────────────────

export default function PlanEditor({ studentId, studentFirstName, mode, onCancel, onSaved, onDraftSaved }: Props) {
  const [initial] = useState(() => initialDraft(mode));
  const [draft, setDraft] = useState<Draft>(initial);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [focusKey, setFocusKey] = useState<string | null>(null);

  const errors = useMemo(() => validate(draft), [draft]);
  const dirty = useMemo(() => signature(draft) !== signature(initial), [draft, initial]);
  const shown = submitted ? errors : null;

  const isEdit = mode.kind === 'edit';
  const isDraft = mode.kind === 'draft';
  const editingAiPlan = mode.kind === 'edit' && mode.plan.prescribedByName === null;

  const totalSets = draft.exercises.reduce((sum, ex) => sum + (isInt(ex.sets) ? Number(ex.sets) : 0), 0);
  const duration = isInt(draft.duration) ? Number(draft.duration) : heuristicDurationMinutes(totalSets);
  const muscles = Array.from(new Set(draft.exercises.map((ex) => ex.muscles).filter(Boolean)));

  const patch = (changes: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...changes }));
    setBanner(null);
  };
  const patchExercise = (key: string, changes: Partial<DraftExercise>) => {
    setDraft((d) => ({
      ...d,
      exercises: d.exercises.map((ex) => (ex.key === key ? { ...ex, ...changes } : ex)),
    }));
    setBanner(null);
  };
  const addExercise = () => {
    // Herda a seção do último para montar blocos seguidos sem trocar o seletor toda vez.
    const last = draft.exercises[draft.exercises.length - 1];
    const ex = blankExercise(last?.section === 'AQUECIMENTO' ? 'PRINCIPAL' : (last?.section ?? 'PRINCIPAL'));
    setDraft((d) => ({ ...d, exercises: [...d.exercises, ex] }));
    setFocusKey(ex.key);
  };
  const removeExercise = (key: string) =>
    setDraft((d) => ({ ...d, exercises: d.exercises.filter((ex) => ex.key !== key) }));
  const moveExercise = (key: string, delta: -1 | 1) =>
    setDraft((d) => {
      const i = d.exercises.findIndex((ex) => ex.key === key);
      const j = i + delta;
      if (i < 0 || j < 0 || j >= d.exercises.length) return d;
      const next = [...d.exercises];
      [next[i], next[j]] = [next[j], next[i]];
      return { ...d, exercises: next };
    });

  const save = async () => {
    if (saving) return;
    setSubmitted(true);
    if (errors.count > 0) {
      setBanner(
        errors.count === 1 ? 'Falta corrigir 1 campo destacado.' : `Faltam corrigir ${errors.count} campos destacados.`,
      );
      // Os destaques só existem depois do próximo render; aí leva o foco ao primeiro.
      requestAnimationFrame(() => {
        const first = rootRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
        first?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        first?.focus({ preventScroll: true });
      });
      return;
    }
    if (mode.kind === 'draft') {
      onDraftSaved?.(toInput(draft));
      return;
    }
    setSaving(true);
    setBanner(null);
    try {
      const input = toInput(draft);
      const saved =
        mode.kind === 'edit'
          ? await updateStudentPlan(studentId, mode.plan.id, input)
          : await createStudentPlan(studentId, input);
      onSaved?.(saved, !isEdit);
    } catch (err: unknown) {
      const response = (err as { response?: { status?: number; data?: unknown } }).response;
      if (response?.status === 400 && typeof response.data === 'string' && response.data) {
        setBanner(response.data);
      } else if (response?.status === 404) {
        setBanner(
          isEdit
            ? 'Esta ficha não existe mais (pode ter sido removida). Volte para a lista para ver as fichas atuais.'
            : `O vínculo com ${studentFirstName} não está mais ativo.`,
        );
      } else {
        setBanner('Não foi possível salvar a ficha. Verifique sua conexão e tente de novo.');
      }
      setSaving(false);
    }
  };

  // Ctrl/Cmd+S salva; sair com alterações pede confirmação também ao fechar a aba.
  const rootRef = useRef<HTMLDivElement>(null);
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // A aba pode estar montada mas oculta (offsetParent null): aí o atalho não é dela.
      if (!rootRef.current?.offsetParent) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void saveRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  const leave = () => (dirty ? setConfirmDiscard(true) : onCancel());

  return (
    <div ref={rootRef} className="flex flex-col">
      {/* Barra fixa: o painel rola por baixo, ações sempre à mão. */}
      <div className="sticky top-0 z-20 border-b border-k-ghost bg-k-bg/85 backdrop-blur-[14px]">
        <div className="mx-auto flex w-full max-w-[1120px] flex-wrap items-center justify-between gap-3 px-8 py-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={leave}
              aria-label="Voltar para as fichas"
              className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-k-surface1 text-k-text-dim transition-colors hover:bg-k-surface2 hover:text-k-text"
            >
              <ArrowLeft className="h-[17px] w-[17px] transition-transform duration-300 group-hover:-translate-x-0.5" />
            </button>
            <div className="min-w-0">
              <h2 className="truncate font-display text-lg font-extrabold tracking-tight font-stretch-semi-expanded">
                {isDraft ? 'Editar ficha da prévia' : isEdit ? 'Editar ficha' : `Nova ficha para ${studentFirstName}`}
              </h2>
              <p className="truncate text-[12.5px] tabular-nums text-k-text-muted">
                {draft.exercises.length} {draft.exercises.length === 1 ? 'exercício' : 'exercícios'} · {totalSets}{' '}
                séries · ~{duration} min
                {dirty && <span className="text-k-warn"> · alterações não salvas</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={leave}
              className="h-10 rounded-xl border border-white/10 bg-k-surface1 px-4 text-sm font-semibold text-k-text-dim transition-colors hover:bg-k-surface2 hover:text-k-text"
            >
              Cancelar
            </button>
            <motion.button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              whileTap={{ scale: 0.97 }}
              title="Salvar (Ctrl+S)"
              className="flex h-10 items-center gap-2 rounded-xl bg-k-primary px-5 text-sm font-bold text-k-on-primary transition-[box-shadow,opacity] hover:shadow-[0_0_0_4px_rgba(0,229,255,0.14),0_10px_26px_-10px_rgba(0,229,255,0.8)] disabled:pointer-events-none disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving
                ? 'Salvando…'
                : isDraft
                  ? 'Aplicar na prévia'
                  : editingAiPlan
                    ? 'Salvar e assumir'
                    : isEdit
                      ? 'Salvar alterações'
                      : 'Salvar ficha'}
            </motion.button>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-5 px-8 py-6">
        <AnimatePresence>
          {banner && (
            <motion.div
              key="banner"
              role="alert"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-2.5 rounded-xl border border-k-alert/25 bg-k-alert/[0.08] px-4 py-3 text-[13px] leading-snug text-k-alert"
            >
              <AlertCircle className="mt-px h-4 w-4 shrink-0" />
              <span>{banner}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {isDraft && (
          <div className="flex items-start gap-3 rounded-[16px] border border-k-warn/20 bg-k-warn/[0.06] px-4 py-3.5 text-[13px] leading-relaxed text-k-text-soft">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-k-warn" />
            <span>
              Você está editando uma ficha da prévia gerada pela IA. As mudanças voltam para a prévia, e nada vai para
              o app de {studentFirstName} até você aprovar.
            </span>
          </div>
        )}

        {editingAiPlan && (
          <div className="flex items-start gap-3 rounded-[16px] border border-k-warn/20 bg-k-warn/[0.06] px-4 py-3.5 text-[13px] leading-relaxed text-k-text-soft">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-k-warn" />
            <span>
              Esta ficha foi gerada pela IA do app. Ao salvar, ela passa a ser sua: {studentFirstName} verá que o treino
              foi prescrito por você, e a regeneração por IA fica bloqueada para não sobrescrever o seu trabalho.
            </span>
          </div>
        )}

        {/* Dados da ficha */}
        <section
          aria-label="Dados da ficha"
          className="grid gap-4 rounded-[20px] border border-k-ghost bg-k-surface1 p-5 md:grid-cols-[minmax(0,2fr)_110px_minmax(0,1fr)_130px]"
        >
          <Field label="Nome da ficha" htmlFor="plan-title" error={shown?.title}>
            <input
              id="plan-title"
              value={draft.title}
              onChange={(e) => patch({ title: e.target.value })}
              placeholder="Ex.: Push Day, Treino A — Superiores"
              maxLength={LIMITS.title + 20}
              aria-invalid={!!shown?.title}
              autoFocus={mode.kind === 'create' && !mode.source}
              className={INPUT}
            />
          </Field>
          <Field label="Dia" htmlFor="plan-tag" error={shown?.tag}>
            <input
              id="plan-tag"
              value={draft.tag}
              onChange={(e) => patch({ tag: e.target.value })}
              placeholder="A"
              aria-invalid={!!shown?.tag}
              className={`${INPUT} uppercase`}
            />
          </Field>
          <Field label="Nível" htmlFor="plan-level">
            <KineticSelect
              id="plan-level"
              value={draft.level}
              onChange={(v) => patch({ level: v })}
              options={LEVEL_OPTIONS}
            />
          </Field>
          <Field label="Duração (min)" htmlFor="plan-duration" error={shown?.duration}>
            <input
              id="plan-duration"
              type="number"
              inputMode="numeric"
              min={LIMITS.durationMin}
              max={LIMITS.durationMax}
              value={draft.duration}
              onChange={(e) => patch({ duration: e.target.value })}
              placeholder={`~${heuristicDurationMinutes(totalSets)}`}
              aria-invalid={!!shown?.duration}
              className={`${INPUT} tabular-nums`}
            />
          </Field>
          <Field
            label="Subtítulo"
            htmlFor="plan-subtitle"
            error={shown?.subtitle}
            className="md:col-span-4"
            hint={
              !draft.subtitle.trim() && muscles.length > 0
                ? `Em branco, o app mostra: ${muscles.join(' / ')}`
                : undefined
            }
          >
            <input
              id="plan-subtitle"
              value={draft.subtitle}
              onChange={(e) => patch({ subtitle: e.target.value })}
              placeholder="Opcional — por padrão, os grupos musculares da ficha"
              aria-invalid={!!shown?.subtitle}
              className={INPUT}
            />
          </Field>
        </section>

        {/* Exercícios */}
        <section aria-labelledby="exercises-title" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h3 id="exercises-title" className="font-display text-base font-extrabold tracking-tight font-stretch-semi-expanded">
              Exercícios
            </h3>
            <p className="flex items-center gap-1.5 text-[12.5px] text-k-text-muted">
              <Info className="h-3.5 w-3.5" />
              No app, aparecem agrupados por seção, nesta ordem dentro de cada uma.
            </p>
          </div>

          {shown?.list && (
            <p role="alert" className="text-[13px] text-k-alert">
              {shown.list}
            </p>
          )}

          <Reorder.Group
            axis="y"
            values={draft.exercises}
            onReorder={(exercises) => setDraft((d) => ({ ...d, exercises }))}
            className="flex flex-col gap-3"
          >
            <AnimatePresence initial={false}>
              {draft.exercises.map((ex, i) => (
                <ExerciseRow
                  key={ex.key}
                  ex={ex}
                  index={i}
                  total={draft.exercises.length}
                  errors={shown?.exercises[ex.key]}
                  autoFocus={focusKey === ex.key}
                  onChange={(changes) => patchExercise(ex.key, changes)}
                  onRemove={() => removeExercise(ex.key)}
                  onMove={(delta) => moveExercise(ex.key, delta)}
                />
              ))}
            </AnimatePresence>
          </Reorder.Group>

          <button
            type="button"
            onClick={addExercise}
            disabled={draft.exercises.length >= LIMITS.exercises}
            className="group flex h-14 items-center justify-center gap-2 rounded-[18px] border border-dashed border-white/15 text-sm font-semibold text-k-text-dim transition-colors hover:border-k-primary/40 hover:bg-k-primary/[0.04] hover:text-k-primary disabled:pointer-events-none disabled:opacity-40"
          >
            <Plus className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
            Adicionar exercício
          </button>
        </section>
      </div>

      <ConfirmDialog
        open={confirmDiscard}
        title="Descartar alterações?"
        description={
          isDraft
            ? 'O que você mudou nesta ficha não será aplicado na prévia.'
            : 'O que você mudou nesta ficha ainda não foi salvo e será perdido.'
        }
        confirmLabel="Descartar"
        destructive
        onConfirm={() => {
          setConfirmDiscard(false);
          onCancel();
        }}
        onCancel={() => setConfirmDiscard(false)}
      />
    </div>
  );
}

// ─── Linha de exercício ──────────────────────────────────────────────────────

interface RowProps {
  ex: DraftExercise;
  index: number;
  total: number;
  errors?: Partial<Record<ExerciseField, string>>;
  autoFocus: boolean;
  onChange: (changes: Partial<DraftExercise>) => void;
  onRemove: () => void;
  onMove: (delta: -1 | 1) => void;
}

function ExerciseRow({ ex, index, total, errors, autoFocus, onChange, onRemove, onMove }: RowProps) {
  const controls = useDragControls();
  const id = (field: string) => `${ex.key}-${field}`;
  const position = String(index + 1).padStart(2, '0');
  const label = ex.name.trim() || `exercício ${index + 1}`;
  // Valor de ficha antiga fora da lista (ex.: "PERNA") continua selecionável.
  const legacyMuscle = ex.muscles && !MUSCLE_GROUPS.some((m) => m.value === ex.muscles) ? ex.muscles : null;

  return (
    <Reorder.Item
      as="div"
      value={ex}
      dragListener={false}
      dragControls={controls}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.18 } }}
      transition={{ duration: 0.4, ease: EASE_OUT }}
      whileDrag={{ scale: 1.01, boxShadow: '0 24px 60px -18px rgba(0,0,0,0.75)', zIndex: 10 }}
      className="relative flex gap-3 rounded-[18px] border border-k-ghost bg-k-surface1 p-4 pl-2.5"
    >
      <div className="flex shrink-0 flex-col items-center gap-1 pt-1">
        <span
          onPointerDown={(e) => controls.start(e)}
          aria-hidden="true"
          title="Arraste para reordenar"
          className="flex h-8 w-7 cursor-grab touch-none items-center justify-center rounded-lg text-k-text-muted transition-colors hover:bg-white/[0.06] hover:text-k-text active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </span>
        <span className="font-display text-[13px] font-extrabold tabular-nums text-k-text-muted font-stretch-semi-expanded">
          {position}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_170px_160px_auto] md:items-end">
          <Field label="Exercício" htmlFor={id('name')} error={errors?.name}>
            <input
              id={id('name')}
              value={ex.name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="Ex.: Supino reto com barra"
              aria-invalid={!!errors?.name}
              autoFocus={autoFocus}
              className={`${INPUT} font-semibold`}
            />
          </Field>
          <Field label="Grupo muscular" htmlFor={id('muscles')}>
            <KineticSelect
              id={id('muscles')}
              value={ex.muscles}
              onChange={(v) => onChange({ muscles: v })}
              options={
                legacyMuscle
                  ? [...MUSCLE_OPTIONS, { value: legacyMuscle, label: muscleLabel(legacyMuscle) }]
                  : MUSCLE_OPTIONS
              }
            />
          </Field>
          <Field label="Seção" htmlFor={id('section')}>
            <KineticSelect
              id={id('section')}
              value={ex.section}
              onChange={(v) => onChange({ section: v as ExerciseSection })}
              options={SECTION_OPTIONS}
            />
          </Field>
          <div className="flex items-center gap-0.5 md:pb-0.5">
            <button
              type="button"
              onClick={() => onMove(-1)}
              disabled={index === 0}
              aria-label={`Mover ${label} para cima`}
              className={ICON_BTN}
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onMove(1)}
              disabled={index === total - 1}
              aria-label={`Mover ${label} para baixo`}
              className={ICON_BTN}
            >
              <ArrowDown className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remover ${label}`}
              className={`${ICON_BTN} hover:bg-k-alert/10 hover:text-k-alert`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-[96px_minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <Field label="Séries" htmlFor={id('sets')} error={errors?.sets}>
            <input
              id={id('sets')}
              type="number"
              inputMode="numeric"
              min={LIMITS.setsMin}
              max={LIMITS.setsMax}
              value={ex.sets}
              onChange={(e) => onChange({ sets: e.target.value })}
              aria-invalid={!!errors?.sets}
              className={`${INPUT} tabular-nums`}
            />
          </Field>
          <Field label="Repetições" htmlFor={id('reps')} error={errors?.reps}>
            <input
              id={id('reps')}
              value={ex.reps}
              onChange={(e) => onChange({ reps: e.target.value })}
              placeholder="8-12"
              aria-invalid={!!errors?.reps}
              className={INPUT}
            />
          </Field>
          <Field label="Carga" htmlFor={id('weight')} error={errors?.weight}>
            <input
              id={id('weight')}
              value={ex.weight}
              onChange={(e) => onChange({ weight: e.target.value })}
              placeholder="40kg (RPE 8)"
              aria-invalid={!!errors?.weight}
              className={INPUT}
            />
          </Field>
          <Field label="Descanso" htmlFor={id('rest')} error={errors?.restTime}>
            <input
              id={id('rest')}
              value={ex.restTime}
              onChange={(e) => onChange({ restTime: e.target.value })}
              placeholder="90s"
              aria-invalid={!!errors?.restTime}
              className={INPUT}
            />
          </Field>
          <Field label="Tipo" htmlFor={id('type')} error={errors?.type}>
            <input
              id={id('type')}
              value={ex.type}
              onChange={(e) => onChange({ type: e.target.value })}
              placeholder="Composto"
              aria-invalid={!!errors?.type}
              className={INPUT}
            />
          </Field>
        </div>

        {ex.showNotes ? (
          <Field
            label="Observação para o aluno"
            htmlFor={id('notes')}
            error={errors?.notes}
            hint={`${ex.notes.trim().length}/${LIMITS.notes}`}
          >
            <textarea
              id={id('notes')}
              value={ex.notes}
              onChange={(e) => onChange({ notes: e.target.value })}
              placeholder="Ex.: descer em 3 segundos, manter as escápulas encaixadas."
              rows={2}
              aria-invalid={!!errors?.notes}
              autoFocus={!ex.notes}
              className={`${INPUT} h-auto resize-y py-2.5 leading-relaxed`}
            />
          </Field>
        ) : (
          <button
            type="button"
            onClick={() => onChange({ showNotes: true })}
            className="flex w-fit items-center gap-1.5 rounded-lg px-1 text-[12.5px] font-semibold text-k-text-muted transition-colors hover:text-k-primary"
          >
            <StickyNote className="h-3.5 w-3.5" />
            Adicionar observação para o aluno
          </button>
        )}
      </div>
    </Reorder.Item>
  );
}

// ─── Campos ──────────────────────────────────────────────────────────────────

function Field({
  label,
  htmlFor,
  error,
  hint,
  className = '',
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={htmlFor} className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-k-text-muted">
          {label}
        </label>
        {hint && !error && <span className="truncate text-[11.5px] text-k-text-muted">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-[12px] leading-snug text-k-alert">{error}</p>}
    </div>
  );
}
