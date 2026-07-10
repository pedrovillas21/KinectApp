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
