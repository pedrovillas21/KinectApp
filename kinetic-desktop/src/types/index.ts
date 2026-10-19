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
  /** Média de aderência dos amigos no mesmo período (%); null com menos de 2 amigos com frequência definida. */
  averagePercentage: number | null;
  /** True quando a aderência do usuário é >= média; null sem média. */
  isAbove: boolean | null;
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

// ── Painel de aderência (GET /api/trainer/students/engagement) ─────────────

export type RiskLevel = 'ALTO' | 'MEDIO' | 'OK';

export interface RiskAlert {
  type: 'NUNCA_TREINOU' | 'INATIVO' | 'QUEDA' | 'BAIXA_ADERENCIA';
  severity: 'ALTO' | 'MEDIO';
  /** Frase pronta, ex.: "Não treina há 12 dias". */
  message: string;
}

export interface StudentEngagement {
  studentId: string;
  /** null = nunca treinou. */
  lastSessionDate: string | null;
  daysSinceLastSession: number | null;
  weeklyTarget: number | null;
  /** Aderência na janela móvel (0–100); null sem meta semanal. */
  adherencePercent: number | null;
  adherenceWindowDays: number;
  sessionsLast7Days: number;
  risk: RiskLevel;
  /** Do mais grave para o mais leve. */
  alerts: RiskAlert[];
}

// ── Financeiro do personal (GET /api/trainer/finance) ──────────────────────

export type PaymentMethod = 'PIX' | 'DINHEIRO' | 'CARTAO' | 'TRANSFERENCIA' | 'OUTRO';

/** ATRASADO = pendente com vencimento no passado (derivado no backend). */
export type ChargeStatus = 'PENDENTE' | 'ATRASADO' | 'PAGO' | 'CANCELADO';

export interface StudentChargeItem {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatarUrl: string | null;
  /** null quando o aluno saiu da carteira. */
  studentPhone: string | null;
  activeStudent: boolean;
  referenceMonth: string;
  dueDate: string;
  amountCents: number;
  status: ChargeStatus;
  paidAt: string | null;
  paymentMethod: PaymentMethod | null;
}

export interface StudentPlanItem {
  studentId: string;
  studentName: string;
  studentAvatarUrl: string | null;
  amountCents: number;
  dueDay: number;
}

export interface FinanceOverview {
  /** AAAA-MM */
  month: string;
  pixKey: string | null;
  expectedCents: number;
  receivedCents: number;
  pendingCents: number;
  overdueCents: number;
  overdueCount: number;
  /** Cobranças do mês + atrasadas de meses anteriores (atrasadas primeiro). */
  charges: StudentChargeItem[];
  plans: StudentPlanItem[];
  studentsWithoutPlan: { studentId: string; studentName: string; studentAvatarUrl: string | null }[];
}

// ── Avaliação física (/api/trainer/students/{id}/assessments) ──────────────

/** Medidas editáveis da avaliação (todas opcionais; ao menos uma exigida). */
export interface AssessmentMeasures {
  weightKg: number | null;
  heightCm: number | null;
  bodyFatPct: number | null;
  muscleMassKg: number | null;
  restingHr: number | null;
  chestCm: number | null;
  waistCm: number | null;
  abdomenCm: number | null;
  hipCm: number | null;
  armRightCm: number | null;
  armLeftCm: number | null;
  thighRightCm: number | null;
  thighLeftCm: number | null;
  calfRightCm: number | null;
  calfLeftCm: number | null;
}

export interface AssessmentInput extends AssessmentMeasures {
  /** AAAA-MM-DD */
  assessedOn: string;
  notes: string | null;
}

export interface PhysicalAssessment extends AssessmentInput {
  id: string;
  /** Calculados no backend. */
  bmi: number | null;
  fatMassKg: number | null;
  leanMassKg: number | null;
  trainerName: string | null;
}

// ── Caixa de entrada "Hoje" (GET /api/trainer/today) ───────────────────────

export type TodayItemType = 'PAGAMENTO' | 'RISCO' | 'PREVIA_IA' | 'REAVALIACAO' | 'FICHA_ANTIGA' | 'CONVITE';

export interface TodayItem {
  type: TodayItemType;
  severity: 'ALTO' | 'MEDIO' | 'INFO';
  studentId: string | null;
  studentName: string | null;
  title: string;
  detail: string;
  /** Rota do painel ("/financeiro") ou âncora da carteira ("#alertas-de-risco"). */
  actionPath: string;
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
  /** Celular (DDD + número) — só vem com vínculo ATIVO; null se não cadastrado. */
  phone: string | null;
}

/** Vínculo personal↔aluno — espelha TrainerLinkDTO do backend. */
export interface TrainerLink {
  id: string;
  peer: TrainerPeer;
  status: 'PENDENTE' | 'ATIVO' | 'RECUSADO' | 'ENCERRADO';
  source: 'INVITE' | 'COMPANY' | 'INVITE_CODE';
  createdAt: string;
  respondedAt: string | null;
}

/**
 * Convite por link (aluno ainda sem conta). `code` só vem na criação/renovação:
 * o servidor guarda apenas o hash, então para reenviar gera-se um código novo.
 */
export interface TrainerInviteCode {
  id: string;
  code: string | null;
  label: string | null;
  expiresAt: string;
  createdAt: string;
  expired: boolean;
}

// ── Assinatura do personal ─────────────────────────────────────────────────

export type SubscriptionStatus = 'TRIAL' | 'PENDENTE' | 'ATIVA' | 'ATRASADA' | 'CANCELADA';

export interface BillingPlanOption {
  code: string;
  name: string;
  /** null no plano "em breve". */
  maxStudents: number | null;
  priceCents: number | null;
  /** Gerações de prévia por IA por mês (somadas na conta). */
  aiGenerationsPerMonth: number | null;
  comingSoon: boolean;
}

export interface BillingOverview {
  /** DEMO = nenhuma cobrança real; ASAAS = cobrança de verdade. */
  gatewayMode: 'DEMO' | 'ASAAS';
  status: SubscriptionStatus;
  plan: string | null;
  planName: string | null;
  studentLimit: number;
  activeStudents: number;
  canAddStudents: boolean;
  trialEndsAt: string;
  currentPeriodEnd: string | null;
  canceledAt: string | null;
  /** Página da cobrança em aberto (caminho do painel no modo demo). */
  checkoutUrl: string | null;
  aiGenerationsUsed: number;
  /** null = sem cota (personal de empresa). */
  aiGenerationsLimit: number | null;
  /** Quando a cota renova; null no teste grátis (total único). */
  aiResetsAt: string | null;
  plans: BillingPlanOption[];
}

/** Prévia pública do link de convite: só nome e foto do personal. */
export interface InviteCodePreview {
  trainerName: string;
  trainerAvatarUrl: string | null;
  expiresAt: string;
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

/** Item de formação do perfil profissional (espelha TrainerProfileDTOs.Education). */
export interface TrainerEducation {
  title: string;
  detail: string | null;
}

/**
 * Perfil profissional do personal (espelha TrainerProfileDTOs.Response).
 * updatedAt null = ainda não salvo (textos nulos, listas vazias).
 */
export interface TrainerProfile {
  trainerId: string;
  nome: string;
  avatarUrl: string | null;
  phone: string | null;
  cref: string | null;
  /** Só o Kinetic verifica; trocar o CREF volta para false. */
  crefVerified: boolean;
  bio: string | null;
  specialties: string[];
  education: TrainerEducation[];
  modality: string | null;
  schedule: string | null;
  location: string | null;
  updatedAt: string | null;
}

/** Corpo do PUT /trainer/profile (substitui o perfil inteiro). */
export interface TrainerProfileInput {
  cref: string | null;
  bio: string | null;
  specialties: string[];
  education: TrainerEducation[];
  modality: string | null;
  schedule: string | null;
  location: string | null;
}
