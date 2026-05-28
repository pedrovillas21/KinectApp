export interface SetLogDto {
  exerciseId: string;
  setNumber: number;
  repsPerformed: number;
  weightUsed: number;
}

export interface LogSessionRequestDTO {
  durationInSeconds: number;
  date: string; // ISO format YYYY-MM-DD
  exercisesLog: SetLogDto[];
  workoutPlanId?: string;
}

export type StatsPeriodId = 'week' | 'month' | 'q' | 'year';

export interface StatsPeriodOption {
  id: StatsPeriodId;
  label: string;
}

export interface VolumeByMuscleGroupDTO {
  muscleGroup: string;
  volume: number;
  /** Variação percentual contra o período anterior (back-end). */
  deltaPercentage: number;
  /** Marca o grupo como dia/ciclo de descanso (sem treino no período). */
  isRest: boolean;
}

export interface WeightPointDTO {
  date: string; // ISO format YYYY-MM-DD
  weight: number;
}

export interface WeightSummaryDTO {
  history: WeightPointDTO[];
  /** Peso atual (kg). */
  current: number;
  /** Variação total (atual - anterior) no período (kg). */
  delta: number;
  /** Unidade do peso (ex.: 'kg'). */
  unit: string;
}

export interface VolumeSummaryDTO {
  byMuscleGroup: VolumeByMuscleGroupDTO[];
  /** Tonelagem total (kg) do período. */
  total: number;
  /** Variação percentual do volume total contra o período anterior. */
  deltaPercentage: number;
}

export interface CommunityComparisonDTO {
  /** Média global de aderência da comunidade (%). */
  averagePercentage: number;
  /** True quando a aderência do usuário é >= média. */
  isAbove: boolean;
}

export interface StatsInsightDTO {
  tag: string;
  body: string;
}

export interface StatsSummaryResponseDTO {
  needsWeightUpdate: boolean;
  /** Período retornado pelo back-end. */
  period: StatsPeriodId;
  /** Aderência (%): completedSessions / targetSessions. */
  efficiencyPercentage: number;
  completedSessions: number;
  targetSessions: number;
  weight: WeightSummaryDTO;
  volume: VolumeSummaryDTO;
  community: CommunityComparisonDTO;
  /** Texto contextual gerado pelo motor de regras do back-end. */
  insight: StatsInsightDTO;
}

export interface NextWorkoutDTO {
  /** Tag exibida no card (ex.: "PUSH · DIA 3 DE 5"). */
  tag: string;
  /** Nome do treino (ex.: "Peito + Tríceps"). */
  name: string;
  /** Duração estimada em minutos. */
  durationInMinutes: number;
  /** Quantidade total de exercícios. */
  exerciseCount: number;
  /** Lista de grupos musculares trabalhados. */
  muscleGroups: string[];
  /** Identificador da ficha de treino (usado ao iniciar a sessão). */
  workoutPlanId: string;
}

export interface RankingEntryDTO {
  id: string;
  /** Posição absoluta no ranking. */
  position: number;
  name: string;
  /** Total de minutos na arena no período. */
  minutes: number;
  /** Delta de minutos vs. semana anterior. */
  delta: number;
  /** True quando o usuário está online. */
  online: boolean;
  /** True quando esta entrada é o próprio usuário. */
  isCurrentUser: boolean;
}

export interface WeeklyActivityPointDTO {
  /** Rótulo curto do dia (ex.: "Seg"). */
  day: string;
  /** Minutos treinados naquele dia. */
  minutes: number;
  /** True quando este ponto corresponde ao dia atual. */
  isToday: boolean;
}

/** Resposta crua de GET /api/sessions/weekly-activity. */
export interface WeeklyActivityDayApiDTO {
  /** Data no formato ISO YYYY-MM-DD. */
  date: string;
  /** Minutos treinados nesse dia (já agregados pelo back-end). */
  minutes: number;
}

export interface WeeklyActivityApiResponseDTO {
  weekStartDate: string;
  weekEndDate: string;
  totalMinutes: number;
  days: WeeklyActivityDayApiDTO[];
}

export interface HomeDashboardResponseDTO {
  /** Status de onboarding do treino (back-end). */
  workoutOnboardingCompleted: boolean;
  /** Primeiro nome do usuário, usado na saudação. */
  userFirstName: string;
  /** Sequência atual de dias consecutivos. */
  streakDays: number;
  completedSessions: number;
  targetSessions: number;
  efficiencyPercentage: number;
  /** Próxima ficha pendente do ciclo. Null quando ainda não há treino gerado. */
  nextWorkout: NextWorkoutDTO | null;
  /** Top entradas do ranking semanal da arena. */
  ranking: RankingEntryDTO[];
  /** Pontos da semana corrente para o gráfico de barras. */
  weeklyActivity: WeeklyActivityPointDTO[];
}

export interface UpdateWeightRequestDTO {
  newWeight: number;
}

export interface UserProfileResponse {
  fullName: string;
  email: string;
  memberSince: string;
  consecutiveDaysLogged: number;
  totalWorkoutsDone: number;
  targetGoal: string;
  /** Data de nascimento ISO (YYYY-MM-DD); idade é derivada no app. */
  birthDate: string | null;
  weight: number | null;
  height: number | null;
  /** Nível no formato do backend: 'INICIANTE' | 'INTERMEDIÁRIO' | 'PRO'. */
  level: string | null;
  /** Frequência semanal (dias de treino). */
  frequency: number | null;
  /** Anamnese em texto livre (ex.: 'Nenhuma', 'Dor no ombro direito'). */
  medicalConditions: string | null;
}

/**
 * Payload de geração/regeneração de treino — espelha GenerateWorkoutRequestDto do backend.
 * Enviado para POST /api/workouts/generate. Os valores de `goal`/`level` usam o
 * formato canônico do backend (ver src/constants/protocol.ts).
 */
export interface GenerateWorkoutRequest {
  birthDate: string;
  weight: number;
  height: number;
  goal: string;
  frequency: number;
  level: string;
  medicalConditions: string;
}
