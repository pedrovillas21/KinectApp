/**
 * Tipos compartilhados do painel do personal — subconjunto relevante dos
 * tipos do mobile (KineticApp/src/types/index.ts), espelhando os DTOs do
 * backend. Manter os dois em sincronia ao alterar os contratos.
 */

// ── Stats (dashboard do aluno) ─────────────────────────────────────────────

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

export interface MetricDeltaDTO {
  previous: number;
  current: number;
  delta: number;
  /** True quando a direção da variação é favorável ao objetivo do usuário. */
  good: boolean;
}

export interface PlanEvolutionResponseDTO {
  /** False quando ainda não houve nenhuma regeneração (sem snapshot anterior). */
  available: boolean;
  /** False quando o ciclo atual ainda não tem sessões registradas. */
  currentCycleStarted: boolean;
  currentCycleStart: string | null; // ISO YYYY-MM-DD
  goal: string | null;
  weight: MetricDeltaDTO | null;
  volume: MetricDeltaDTO | null;
  adherence: MetricDeltaDTO | null;
  previousCompletedSessions: number;
  currentCompletedSessions: number;
  /** Volume por grupo muscular do ciclo anterior (para detalhe). */
  volumeByMuscle: Record<string, number> | null;
  insight: StatsInsightDTO | null;
}

/** Espelha MonthlyStatsResponseDTO (GET /api/trainer/students/{id}/monthly-stats). */
export interface MonthlyStatsResponseDTO {
  completedSessions: number;
  targetSessions: number;
  efficiency: number;
}

// ── Paginação genérica (Spring Page<T>) ────────────────────────────────────

export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  last: boolean;
}

// ── Vínculo personal↔aluno ─────────────────────────────────────────────────

/** Lado oposto de um vínculo personal↔aluno (para o personal, é o aluno). */
export interface TrainerPeer {
  id: string;
  nome: string;
  email: string;
  avatarUrl: string | null;
}

/** Vínculo personal↔aluno — espelha TrainerLinkDTO do backend. */
export interface TrainerLink {
  id: string;
  peer: TrainerPeer;
  status: 'PENDENTE' | 'ATIVO' | 'RECUSADO' | 'ENCERRADO';
  source: 'INVITE' | 'COMPANY';
  createdAt: string;
  respondedAt: string | null;
}

// ── Fichas de treino (prescrição pelo personal) ─────────────────────────────

export type ExerciseSection = 'AQUECIMENTO' | 'PRINCIPAL' | 'FINALIZACAO';

/** Exercício de uma ficha — espelha ExerciseResponseDTO do backend. */
export interface WorkoutExercise {
  id: string;
  name: string;
  muscles: string | null;
  type: string | null;
  sets: number | null;
  reps: string | null;
  weight: string | null;
  restTime: string | null;
  section: string | null;
  notes: string | null;
}

/** Ficha vigente do aluno — espelha WorkoutPlanResponseDTO do backend. */
export interface WorkoutPlan {
  id: string;
  title: string;
  subtitle: string | null;
  tag: string | null;
  level: string;
  estimatedDurationMinutes: number | null;
  estimatedTotalVolumeKg: number | null;
  lastCompletedAt: string | null;
  createdAt: string;
  /** Nome do personal que montou a ficha; null = gerada por IA no app. */
  prescribedByName: string | null;
  /** Criada com IA pelo personal e aprovada por ele no painel. */
  aiAssisted: boolean;
  data: WorkoutExercise[];
}

/** Exercício enviado ao salvar. `id` presente = exercício existente (preserva o histórico). */
export interface WorkoutExerciseInput {
  id?: string;
  name: string;
  muscles: string | null;
  type: string | null;
  sets: number;
  reps: string;
  weight: string | null;
  restTime: string | null;
  section: ExerciseSection;
  notes: string | null;
}

/** Corpo de POST/PUT /trainer/students/{id}/plans — espelha TrainerWorkoutPlanRequestDTO. */
export interface WorkoutPlanInput {
  title: string;
  subtitle: string | null;
  tag: string | null;
  level: string | null;
  estimatedDurationMinutes: number | null;
  exercises: WorkoutExerciseInput[];
}

// ── Fichas com IA (pedido do personal → prévia → aprovação) ─────────────────

/** Anamnese do aluno que vai para a IA — espelha AiPlanContextDTO. null = não informado. */
export interface AiPlanContext {
  goal: string | null;
  level: string;
  age: number | null;
  weightKg: number | null;
  heightCm: number | null;
  frequency: number | null;
  medicalConditions: string | null;
  activePlanCount: number;
}

/** Corpo de POST /trainer/students/{id}/ai-plans/preview — espelha TrainerAiPlanRequestDTO. */
export interface AiPlanRequest {
  prompt: string;
  planCount: number;
  durationMinutes: number | null;
  level: string | null;
}

export interface AiPlanNote {
  title: string;
  detail: string | null;
}

export interface AiDraftExercise {
  name: string;
  muscles: string | null;
  type: string | null;
  sets: number;
  reps: string;
  weight: string | null;
  restTime: string | null;
  section: string;
  notes: string | null;
  /** Motivo para o personal conferir o exercício; null quando não há. */
  attention: string | null;
}

export interface AiDraftPlan {
  title: string;
  subtitle: string | null;
  estimatedDurationMinutes: number | null;
  exercises: AiDraftExercise[];
}

/** Prévia gerada pela IA (nada foi salvo no app do aluno) — espelha AiPlanPreviewDTO. */
export interface AiPlanPreview {
  generationId: string;
  createdAt: string;
  expiresAt: string;
  understood: AiPlanNote[];
  attentionPoints: AiPlanNote[];
  plans: AiDraftPlan[];
}

/** Corpo de POST /trainer/students/{id}/ai-plans/{generationId}/approve. */
export interface AiPlanApproval {
  replaceCurrent: boolean;
  declarationAccepted: boolean;
  plans: WorkoutPlanInput[];
}

// ── Painel ROOT ──────────────────────────────────────────────────────────────

export type UserStatus = 'ATIVO' | 'SUSPENSO' | 'BLOQUEADO';

/** Espelha RootMetricsDTO. */
export interface RootMetrics {
  totalCompanies: number;
  totalPersonais: number;
  totalAlunos: number;
  newUsersInPeriod: number;
  growth: { date: string; count: number }[];
}

/** Espelha CompanyDTO. */
export interface Company {
  id: string;
  nome: string;
  createdAt: string;
  ownerId: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  ownerStatus: UserStatus | null;
}

/** Espelha UserAdminDTO. */
export interface UserAdmin {
  id: string;
  nome: string;
  email: string;
  role: 'ALUNO' | 'PERSONAL' | 'EMPRESA' | 'ROOT';
  status: UserStatus;
  companyId: string | null;
  createdAt: string;
}

// ── Painel EMPRESA ───────────────────────────────────────────────────────────

/** Espelha EmpresaStudentLinkDTO. */
export interface EmpresaStudentLink {
  linkId: string;
  student: TrainerPeer;
  trainer: TrainerPeer;
  createdAt: string;
}

/** Espelha EmpresaAnalyticsDTO. */
export interface EmpresaAnalytics {
  personaisAtivos: number;
  alunosAtivos: number;
  alunosVinculadosNoPeriodo: number;
  retentionRate: number;
  sessoesNoPeriodo: number;
  volumeSeries: { date: string; sessions: number }[];
  desempenhoPorInstrutor: {
    trainerId: string;
    trainerName: string;
    activeStudents: number;
  }[];
}

/** Espelha FeedbackDTO. */
export interface Feedback {
  id: string;
  content: string;
  anonymous: boolean;
  createdAt: string;
  studentName: string | null;
  personalName: string;
  corporate: boolean;
}

// ── Chat ───────────────────────────────────────────────────────────────────

/** Mensagem do chat personal↔aluno — espelha ChatMessageDTO do backend. */
export interface ChatMessage {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  sentAt: string;
  readAt: string | null;
}
