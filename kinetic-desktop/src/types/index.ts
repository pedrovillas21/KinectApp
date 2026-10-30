/**
 * Tipos compartilhados do painel do personal — subconjunto relevante dos
 * tipos do mobile (KineticApp/src/types/index.ts), espelhando os DTOs do
 * backend. Manter os dois em sincronia ao alterar os contratos.
 */

// ── Stats (dashboard do aluno) ─────────────────────────────────────────────

export type StatsPeriodId = 'week' | 'month' | 'q' | 'year';

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
  /** Pausa dos alertas em vigor; null = alertas valendo. */
  pause: AlertPause | null;
}

export type AlertPauseReason = 'LESAO' | 'VIAGEM' | 'CONTATO' | 'OUTRO';

export interface AlertPause {
  /** Alertas escondidos até esta data (inclusive), yyyy-mm-dd. */
  until: string;
  reason: AlertPauseReason | null;
  note: string | null;
  pausedAt: string | null;
}

// ── Financeiro do personal (GET /api/trainer/finance) ──────────────────────

export type PaymentMethod = 'PIX' | 'DINHEIRO' | 'CARTAO' | 'TRANSFERENCIA' | 'OUTRO';

/** ATRASADO = pendente com vencimento no passado (derivado no backend). */
export type ChargeStatus = 'PENDENTE' | 'ATRASADO' | 'PAGO' | 'CANCELADO';

export interface StudentChargeItem {
  id: string;
  /** null: o aluno excluiu a conta; a cobrança paga fica só como registro (nome já vem com "(conta excluída)"). */
  studentId: string | null;
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

export type TodayItemType = 'PAGAMENTO' | 'TREINO_HOJE' | 'PREVIA_IA' | 'REAVALIACAO' | 'FICHA_ANTIGA' | 'CONVITE';

export interface TodayItem {
  type: TodayItemType;
  severity: 'ALTO' | 'MEDIO' | 'INFO';
  studentId: string | null;
  studentName: string | null;
  title: string;
  detail: string;
  /** Rota do painel ("/financeiro") ou âncora da carteira ("#convites-pendentes"). */
  actionPath: string;
  /** Celular do aluno para o WhatsApp (só em TREINO_HOJE). */
  studentPhone: string | null;
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
  /** Acima do limite do plano Grátis: o personal só vê, não edita (até assinar). */
  frozen: boolean;
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
  /** null = ilimitado (ou plano "em breve"). */
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
  /** null = alunos ilimitados. */
  studentLimit: number | null;
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
  /** Gerações de pacotes extras ainda não usadas (não expiram; gastas depois da cota). */
  aiExtraCredits: number;
  aiPack: { credits: number; priceCents: number };
  /** Página do pacote de IA aguardando pagamento (caminho do painel no modo demo). */
  aiPackCheckoutUrl: string | null;
  /** Prazo para escolher quem fica ativo no Grátis; null fora do prazo. */
  chooseActiveUntil: string | null;
  /** Alunos congelados por passar do limite do Grátis. */
  frozenStudents: number;
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

/** GET/PUT /trainer/students/{id}/protocol — espelha StudentProtocolDTOs. */
export interface StudentProtocol {
  goal: string | null;
  level: string | null;
  frequency: number | null;
  medicalConditions: string | null;
  managedByName: string | null;
  protocolUpdatedAt: string | null;
  protocolUpdatedByName: string | null;
  protocolUpdatedByStudent: boolean;
  anamnesisUpdatedAt: string | null;
  anamnesisUpdatedByName: string | null;
  anamnesisUpdatedByStudent: boolean;
  /** Quando o aluno conferiu a anamnese no app; null = ainda não conferiu a versão atual. */
  anamnesisConfirmedAt: string | null;
}

export interface StudentProtocolUpdate {
  goal: string;
  level: string;
  frequency: number;
  medicalConditions: string | null;
}

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

/** Espelha CompanyDTO: uma rede de empresas e o dono dela. */
export interface Company {
  id: string;
  nome: string;
  cnpj: string | null;
  slug: string | null;
  createdAt: string;
  /** Quantidade de filiais cadastradas pelo dono. */
  units: number;
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
  role: 'ALUNO' | 'PERSONAL' | 'EMPRESA' | 'DONO' | 'ROOT';
  status: UserStatus;
  companyId: string | null;
  createdAt: string;
}

/** Espelha UnitDTOs.Response: filial da rede do dono. */
export interface Unit {
  id: string;
  nome: string;
  cnpj: string;
  address: string | null;
  phone: string | null;
  responsibleName: string;
  responsibleEmail: string;
  /** Login da filial: rede.filial. */
  username: string | null;
  /** Conta da filial (para ações do ROOT). */
  accountId: string | null;
  active: boolean;
  secondFactorEnabled: boolean;
  personais: number;
  alunosAtivos: number;
  createdAt: string;
}

export interface UnitInput {
  nome: string;
  cnpj: string;
  address: string;
  phone: string;
  responsibleName: string;
  responsibleEmail: string;
  /** Só na criação: vira rede.usuario. */
  usuario?: string;
}

/** Espelha UnitDTOs.Network: a rede do dono logado. */
export interface Network {
  id: string;
  nome: string;
  cnpj: string | null;
  slug: string | null;
}

/** Espelha TrainerCompanyDTO: empresa atual e convite pendente do personal (cada um pode ser nulo). */
export interface TrainerCompany {
  current: { id: string; nome: string } | null;
  pending: { id: string; nome: string } | null;
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

// ── Auditoria do ROOT (/api/root/audit) ────────────────────────────────────

export type AuditCategory = 'ADMIN' | 'SECURITY' | 'HEALTH' | 'BILLING' | 'LGPD';

/** Espelho do enum AuditAction do backend; os rótulos ficam em pages/root/audit/auditLabels.ts. */
export type AuditAction =
  | 'COMPANY_CREATED'
  | 'PERSONAL_CREATED'
  | 'USER_STATUS_CHANGED'
  | 'USER_SOFT_DELETED'
  | 'USER_DELETED_BY_ADMIN'
  | 'PASSWORD_REGENERATED'
  | 'SECOND_FACTOR_RESET'
  | 'UNIT_CREATED'
  | 'UNIT_UPDATED'
  | 'UNIT_STATUS_CHANGED'
  | 'TRAINER_INVITED_TO_COMPANY'
  | 'TRAINER_REMOVED_FROM_COMPANY'
  | 'COMPANY_INVITE_ACCEPTED'
  | 'COMPANY_INVITE_DECLINED'
  | 'TRAINER_LEFT_COMPANY'
  | 'STUDENT_LINKED_BY_COMPANY'
  | 'COMPANY_LINK_ENDED'
  | 'ACCESS_LOGS_VIEWED'
  | 'LOGIN_FAILED'
  | 'LOGIN_RATE_LIMITED'
  | 'TOTP_ENABLED'
  | 'TOTP_FAILED'
  | 'RECOVERY_CODE_USED'
  | 'PASSWORD_CHANGED'
  | 'PASSWORD_RESET_COMPLETED'
  | 'PASSWORD_RESET_FAILED'
  | 'EMAIL_CONFIRMED'
  | 'HEALTH_DATA_VIEWED'
  | 'ASSESSMENT_CREATED'
  | 'ASSESSMENT_UPDATED'
  | 'ASSESSMENT_DELETED'
  | 'PROTOCOL_UPDATED'
  | 'SUBSCRIPTION_STATUS_CHANGED'
  | 'AI_PACK_CREDITED'
  | 'RETENTION_PURGED'
  | 'DATA_REQUEST_OPENED'
  | 'DATA_REQUEST_COMPLETED';

/** Conta ou empresa citada num registro. Excluída: `deleted` e nome nulo. */
export interface AuditParty {
  id: string | null;
  name: string | null;
  deleted: boolean;
}

export interface AuditEvent {
  id: number;
  occurredAt: string;
  category: AuditCategory;
  action: AuditAction;
  /** Nulo: sistema, gateway de pagamento ou tentativa sem login. */
  actor: AuditParty | null;
  actorRole: string | null;
  targetType: 'USER' | 'COMPANY' | 'LINK' | null;
  target: AuditParty | null;
  company: AuditParty | null;
  /** Só na categoria SECURITY. */
  ip: string | null;
  reason: string | null;
  details: Record<string, unknown> | null;
}

export interface AccessLogEntry {
  accessedAt: string;
  ip: string;
  event: 'LOGIN' | 'REFRESH' | 'ACCESS';
}

export interface AccessLogResult {
  userId: string;
  deletedAccount: boolean;
  logs: AccessLogEntry[];
  /** O período tinha mais linhas que o limite da resposta. */
  truncated: boolean;
}

export interface DeletedAccountRow {
  userId: string;
  role: string;
  deletedBy: 'TITULAR' | 'ADMIN';
  deletedByAdmin: AuditParty | null;
  blocked: boolean;
  deletedAt: string;
  retainUntil: string;
}

export interface AuditLgpd {
  deletions: { byTitular: number; byAdmin: number; blocked: number };
  terms: { currentVersion: string; accepted: number; pending: number };
  lastPurge: { at: string; counts: Record<string, number> | null } | null;
  requests: { open: number; dueSoon: number; overdue: number };
  deletedAccounts: Page<DeletedAccountRow>;
}

export type DataRequestKind = 'ACESSO' | 'CORRECAO' | 'ELIMINACAO' | 'REVOGACAO' | 'INFORMACAO';
export type DataRequestStatus = 'ABERTO' | 'CONCLUIDO';

export interface DataRequest {
  id: string;
  kind: DataRequestKind;
  receivedAt: string;
  dueAt: string;
  status: DataRequestStatus;
  completedAt: string | null;
  /** Nulo: a conta do titular foi excluída depois do pedido. */
  subject: AuditParty | null;
  note: string | null;
  createdBy: AuditParty | null;
}

export interface AuditAiApproval {
  id: string;
  approvedAt: string;
  trainer: AuditParty;
  trainerCref: string | null;
  model: string | null;
  replacedCurrent: boolean | null;
  student: AuditParty;
}

export interface AuditAi {
  /** Gerações (prévias) criadas no período; as aprovadas estão entre elas. */
  previews: number;
  approved: number;
  approvals: Page<AuditAiApproval>;
}

export interface BillingGatewayInfo {
  gateway: string;
  demo: boolean;
}
