import type { ExerciseSection } from '../../types';

/**
 * Vocabulário das fichas. Os grupos musculares são os mesmos que o prompt da IA
 * (GeminiService) usa: o volume por grupo nas estatísticas agrupa por esse texto,
 * então fichas do personal e da IA precisam falar a mesma língua.
 */
export const MUSCLE_GROUPS: { value: string; label: string }[] = [
  { value: 'PEITO', label: 'Peito' },
  { value: 'COSTAS', label: 'Costas' },
  { value: 'OMBRO', label: 'Ombro' },
  { value: 'BICEPS', label: 'Bíceps' },
  { value: 'TRICEPS', label: 'Tríceps' },
  { value: 'ANTEBRACO', label: 'Antebraço' },
  { value: 'QUADRICEPS', label: 'Quadríceps' },
  { value: 'POSTERIOR', label: 'Posterior' },
  { value: 'GLUTEOS', label: 'Glúteos' },
  { value: 'PANTURRILHA', label: 'Panturrilha' },
];

/** `color` marca a seção no editor (mesmos tons de aviso/marca/sucesso do tema). */
export const SECTIONS: { value: ExerciseSection; label: string; color: string }[] = [
  { value: 'AQUECIMENTO', label: 'Aquecimento', color: '#f5b945' },
  { value: 'PRINCIPAL', label: 'Principal', color: '#00e5ff' },
  { value: 'FINALIZACAO', label: 'Finalização', color: '#4ade80' },
];

export const LEVELS: { value: string; label: string }[] = [
  { value: 'INICIANTE', label: 'Iniciante' },
  { value: 'INTERMEDIÁRIO', label: 'Intermediário' },
  { value: 'PRO', label: 'Avançado' },
];

/** Limites espelhados do TrainerWorkoutPlanRequestDTO / TrainerExerciseRequestDTO. */
export const LIMITS = {
  title: 60,
  subtitle: 120,
  tag: 20,
  exercises: 30,
  name: 120,
  reps: 40,
  weight: 80,
  restTime: 40,
  type: 40,
  notes: 500,
  setsMin: 1,
  setsMax: 20,
  durationMin: 5,
  durationMax: 240,
} as const;

/** Rótulo legível de um grupo muscular (valores fora da lista, de fichas antigas, passam como vieram). */
export const muscleLabel = (value: string | null | undefined): string => {
  if (!value) return '';
  return MUSCLE_GROUPS.find((m) => m.value === value.toUpperCase())?.label ?? value;
};

/** Mesmo cálculo do backend (WorkoutPlanResponseDTO.heuristicDurationMinutes). */
export const heuristicDurationMinutes = (totalSets: number): number =>
  Math.max(20, Math.round(totalSets * 1.2));
