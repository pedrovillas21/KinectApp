// Constantes compartilhadas do protocolo de treino.
// Usadas pelo onboarding (seleção por id interno) e pela tela de Perfil
// (edição/regeneração, que opera com o valor canônico do backend).

export type GoalType = 'loss' | 'mass' | 'perf' | '';
export type LevelType = 'beg' | 'int' | 'pro' | '';

export interface GoalDef {
  id: Exclude<GoalType, ''>;
  title: string;
  sub: string;
}

export interface LevelDef {
  id: Exclude<LevelType, ''>;
  title: string;
  sub: string;
}

export const GOALS: GoalDef[] = [
  { id: 'mass', title: 'Ganho de Massa',   sub: 'Hipertrofia + sobrecarga progressiva' },
  { id: 'loss', title: 'Perda de Gordura', sub: 'Déficit calórico + condicionamento metabólico' },
  { id: 'perf', title: 'Performance',      sub: 'Força máxima, explosão e resistência' },
];

export const LEVELS: LevelDef[] = [
  { id: 'beg', title: 'Iniciante',     sub: 'Estou começando minha jornada agora.' },
  { id: 'int', title: 'Intermediário', sub: 'Já treino há alguns meses com consistência.' },
  { id: 'pro', title: 'Avançado',      sub: 'Anos de experiência e técnica refinada.' },
];

export const DAYS_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

// IDs internos → valores esperados pelo backend / prompt do Gemini.
export const GOAL_API_MAP: Record<Exclude<GoalType, ''>, string> = {
  mass: 'Ganho de Massa',
  loss: 'Perda de Gordura',
  perf: 'Performance',
};

export const LEVEL_API_MAP: Record<Exclude<LevelType, ''>, string> = {
  beg: 'INICIANTE',
  int: 'INTERMEDIÁRIO',
  pro: 'PRO',
};

// ─── Opções orientadas ao valor canônico do backend (tela de Perfil) ───
export interface ProtocolOption {
  /** Valor exato persistido/enviado ao backend (ex.: 'Ganho de Massa', 'INTERMEDIÁRIO'). */
  value: string;
  title: string;
  sub: string;
}

export const GOAL_OPTIONS: ProtocolOption[] = GOALS.map((g) => ({
  value: GOAL_API_MAP[g.id],
  title: g.title,
  sub: g.sub,
}));

export const LEVEL_OPTIONS: ProtocolOption[] = LEVELS.map((l) => ({
  value: LEVEL_API_MAP[l.id],
  title: l.title,
  sub: l.sub,
}));

/** Opções de frequência semanal (dias de treino) oferecidas no onboarding e no perfil. */
export const FREQUENCY_OPTIONS: ProtocolOption[] = [
  { value: '2', title: '2 dias', sub: 'Manutenção' },
  { value: '3', title: '3 dias', sub: 'Ideal para iniciantes' },
  { value: '4', title: '4 dias', sub: 'Equilíbrio entre estímulo e recuperação' },
  { value: '5', title: '5 dias', sub: 'Volume alto, divisão por grupo muscular' },
  { value: '6', title: '6 dias', sub: 'Avançado — atenção à recuperação' },
];

/** Rótulo amigável do objetivo a partir do valor do backend. */
export function goalLabel(value?: string | null): string {
  if (!value) return '—';
  return GOAL_OPTIONS.find((o) => o.value === value)?.title ?? value;
}

/** Rótulo amigável do nível (ex.: 'INTERMEDIÁRIO' → 'Intermediário'). */
export function levelLabel(value?: string | null): string {
  if (!value) return '—';
  return LEVEL_OPTIONS.find((o) => o.value === value)?.title ?? value;
}

/** Idade em anos a partir de uma data de nascimento ISO (YYYY-MM-DD). null se inválida. */
export function ageFromBirthDate(birthDate?: string | null): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age >= 0 && age <= 120 ? age : null;
}

/** True quando a anamnese está efetivamente preenchida (não vazia e não "Nenhuma"). */
export function hasMedicalInfo(value?: string | null): boolean {
  if (!value) return false;
  const v = value.trim().toLowerCase();
  return v !== '' && v !== 'nenhuma' && v !== 'nenhuma restrição relatada';
}
