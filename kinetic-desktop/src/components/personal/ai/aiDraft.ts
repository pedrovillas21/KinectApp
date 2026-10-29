import { SECTIONS } from '../workoutVocab';
import type { AiDraftPlan, ExerciseSection, WorkoutPlan, WorkoutPlanInput } from '../../../types';

/** Ficha da prévia como o personal a vê e aprova (com as edições dele). */
export interface PreviewPlan {
  input: WorkoutPlanInput;
  /** Alerta da IA por exercício, pelo nome normalizado: sobrevive a reordenar e editar. */
  attention: Record<string, string>;
  /** Alterada pelo personal no editor depois de gerada. */
  edited: boolean;
}

/** Pedido montado no compositor (mantido ao voltar da prévia para ajustar). */
export interface AiRequestForm {
  prompt: string;
  scope: 'one' | 'full';
  count: number;
  duration: string;
  level: string;
  /** Substituir as fichas atuais do aluno ao aprovar (ou manter e adicionar). */
  replace: boolean;
}

export const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const nameKey = (name: string) => name.trim().toLowerCase();

export const attentionFor = (plan: PreviewPlan, exerciseName: string): string | null =>
  plan.attention[nameKey(exerciseName)] ?? null;

/** "A", "dia b", "DIA C" → "A"/"B"/"C". */
export const bareTag = (tag: string | null) => (tag ?? '').trim().toUpperCase().replace(/^DIA\s+/, '');

export const dayLabel = (tag: string | null, index: number) => `DIA ${bareTag(tag) || LETTERS[index % 26]}`;

/** Letras para as fichas novas: do A ao substituir; senão, as primeiras livres. */
export function tagsFor(count: number, replace: boolean, current: WorkoutPlan[]): string[] {
  const used = replace ? new Set<string>() : new Set(current.map((p) => bareTag(p.tag)));
  return [...LETTERS].filter((l) => !used.has(l)).slice(0, count);
}

const toSection = (value: string): ExerciseSection =>
  SECTIONS.find((s) => s.value === value.toUpperCase())?.value ?? 'PRINCIPAL';

/** Converte as fichas da IA para o formato de salvar, já com as letras do dia e o nível escolhido. */
export function toPreviewPlans(plans: AiDraftPlan[], tags: string[], level: string): PreviewPlan[] {
  return plans.map((plan, i) => {
    const attention: Record<string, string> = {};
    for (const ex of plan.exercises) {
      if (ex.attention) attention[nameKey(ex.name)] = ex.attention;
    }
    return {
      attention,
      edited: false,
      input: {
        title: plan.title,
        subtitle: plan.subtitle,
        tag: tags[i] ?? null,
        level: level || null,
        estimatedDurationMinutes: plan.estimatedDurationMinutes,
        exercises: plan.exercises.map((ex) => ({
          name: ex.name,
          muscles: ex.muscles,
          type: ex.type,
          sets: ex.sets,
          reps: ex.reps,
          weight: ex.weight,
          restTime: ex.restTime,
          section: toSection(ex.section),
          notes: ex.notes,
        })),
      },
    };
  });
}

export const totalSets = (input: WorkoutPlanInput) => input.exercises.reduce((sum, ex) => sum + ex.sets, 0);

/** Mesmo subtítulo automático do backend: os grupos musculares da ficha. */
export const autoSubtitle = (input: WorkoutPlanInput) =>
  Array.from(new Set(input.exercises.map((ex) => (ex.muscles ?? '').trim().toUpperCase()).filter(Boolean))).join(
    ' / ',
  );

/** Lista com vírgulas e "e" no fim: "DIA A, DIA B e DIA C". */
export const joinPt = (items: string[]) =>
  items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} e ${items[items.length - 1]}`;
