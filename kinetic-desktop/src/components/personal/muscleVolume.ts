import type { WorkoutExercise } from '../../types';

/**
 * Séries semanais por grupo muscular nas fichas ativas (mapa muscular da aba Treinos).
 *
 * Regras:
 * - `muscles` é texto livre ("Peito / Tríceps"): partido em / , + ; & e " e ".
 * - Primeiro músculo citado conta 1 série por série prescrita; os demais, 0,5.
 *   O peso é pela posição no texto, mesmo quando o primeiro não é reconhecido.
 * - Um grupo citado duas vezes no mesmo exercício conta uma vez (o maior peso).
 * - Séries de AQUECIMENTO ficam de fora: o mapa mostra volume de trabalho.
 * - Semana: cada ficha pesa `frequência / nº de fichas` (rodízio). Sem frequência
 *   no protocolo, cada ficha conta uma vez por semana.
 * - Termos não reconhecidos (e exercícios sem músculo) vão para `unmatched`, nunca somem.
 */

export type MuscleGroup =
  | 'PEITO'
  | 'COSTAS'
  | 'OMBRO'
  | 'BICEPS'
  | 'TRICEPS'
  | 'ANTEBRACO'
  | 'ABDOMEN'
  | 'QUADRICEPS'
  | 'POSTERIOR'
  | 'GLUTEOS'
  | 'PANTURRILHA';

export const GROUP_LABEL: Record<MuscleGroup, string> = {
  PEITO: 'Peito',
  COSTAS: 'Costas',
  OMBRO: 'Ombro',
  BICEPS: 'Bíceps',
  TRICEPS: 'Tríceps',
  ANTEBRACO: 'Antebraço',
  ABDOMEN: 'Abdômen',
  QUADRICEPS: 'Quadríceps',
  POSTERIOR: 'Posterior',
  GLUTEOS: 'Glúteos',
  PANTURRILHA: 'Panturrilha',
};

/** Ordem importa: "deltoide posterior" é ombro e "posterior de coxa" vem antes de "coxa" (quadríceps). */
const PATTERNS: [MuscleGroup, RegExp][] = [
  ['OMBRO', /ombro|deltoid|shoulder/],
  ['POSTERIOR', /posterior|isquio|hamstring|femoral/],
  ['PEITO', /peit|chest/],
  ['COSTAS', /costa|dorsa|\blats?\b|trapezi|lombar|romboide|back/],
  ['BICEPS', /bicep/],
  ['TRICEPS', /tricep/],
  ['ANTEBRACO', /antebraco|forearm|punho/],
  ['ABDOMEN', /abdom|\babs?\b|core|obliq|reto abdominal/],
  ['QUADRICEPS', /quadricep|\bquads?\b|coxa|anterior/],
  ['GLUTEOS', /glute/],
  ['PANTURRILHA', /panturr|calf|calves|gemeo|soleo/],
];

const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

/** Um termo livre → grupo fixo, ou null se não reconhecido. */
export function normalizeMuscle(term: string): MuscleGroup | null {
  const t = fold(term);
  if (!t) return null;
  return PATTERNS.find(([, re]) => re.test(t))?.[0] ?? null;
}

export const splitMuscles = (muscles: string | null): string[] =>
  (muscles ?? '')
    .split(/\s*(?:[/,+;&|]|\se\s)\s*/i)
    .map((s) => s.trim())
    .filter(Boolean);

export interface MuscleVolume {
  byGroup: Record<MuscleGroup, number>;
  /** Termo como veio (ou "Sem grupo muscular") → séries semanais. */
  unmatched: Record<string, number>;
  /** Fator semanal aplicado a cada ficha. */
  perPlanWeekly: number;
}

export const NO_GROUP = 'Sem grupo muscular';

/** Ficha salva (`WorkoutPlan`) ou da prévia da IA: só os campos que entram na conta. */
export interface VolumeSource {
  data: Pick<WorkoutExercise, 'muscles' | 'sets' | 'section'>[];
}

export function weeklyMuscleVolume(plans: VolumeSource[], frequency: number | null): MuscleVolume {
  const byGroup = Object.fromEntries(Object.keys(GROUP_LABEL).map((g) => [g, 0])) as Record<MuscleGroup, number>;
  const unmatched: Record<string, number> = {};
  const perPlanWeekly = frequency && frequency > 0 && plans.length > 0 ? frequency / plans.length : 1;

  for (const plan of plans) {
    for (const ex of plan.data) {
      if ((ex.section ?? '').toUpperCase() === 'AQUECIMENTO') continue;
      const sets = (ex.sets ?? 0) * perPlanWeekly;
      if (sets <= 0) continue;
      const terms = splitMuscles(ex.muscles);
      if (terms.length === 0) {
        unmatched[NO_GROUP] = (unmatched[NO_GROUP] ?? 0) + sets;
        continue;
      }
      const weights = new Map<MuscleGroup, number>();
      terms.forEach((term, i) => {
        const w = i === 0 ? 1 : 0.5;
        const g = normalizeMuscle(term);
        if (g) weights.set(g, Math.max(weights.get(g) ?? 0, w));
        else unmatched[term] = (unmatched[term] ?? 0) + sets * w;
      });
      weights.forEach((w, g) => (byGroup[g] += sets * w));
    }
  }
  return { byGroup, unmatched, perPlanWeekly };
}
