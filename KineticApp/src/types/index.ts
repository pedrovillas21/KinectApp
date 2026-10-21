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
  // Gerado uma vez por treino e repetido em toda tentativa: o backend não grava duas vezes.
  clientSessionId?: string;
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
  /** Com personal ativo o peso vem das avaliações físicas dele: o aluno não registra. */
  weightManagedByTrainer: boolean;
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
  training: StatsTrainingDTO;
  activity: StatsActivityDTO;
}

/** Tempo treinado, recordes e sequência da aba Progresso. */
export interface StatsTrainingDTO {
  minutes: number;
  /** Minutos do período anterior de mesmo tamanho (para a variação). */
  previousMinutes: number;
  recordsCount: number;
  /** Recorde mais recente do período; null quando não houve. */
  latestRecord: PersonalRecord | null;
  streakDays: number;
  bestStreakDays: number;
}

export interface ActivityBucketDTO {
  /** Primeiro dia da barra (YYYY-MM-DD). */
  start: string;
  sessions: number;
  minutes: number;
}

/** Treinos do período em barras: dias (semana), semanas (mês/3M) ou meses (ano). */
export interface StatsActivityDTO {
  granularity: 'day' | 'week' | 'month';
  /** Meta de treinos por barra; null nas barras diárias ou sem frequência definida. */
  target: number | null;
  buckets: ActivityBucketDTO[];
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
  /** Os 3 primeiros exercícios da ficha (redesign; ausente em backend antigo). */
  exercises?: NextWorkoutExerciseDTO[];
  /** Personal que montou a ficha; null quando o próprio aluno/IA gerou. */
  prescribedBy?: UserRefDTO | null;
}

/**
 * Como o exercício é carregado: EXTERNAL (peso digitado), BODYWEIGHT (peso do
 * aluno + carga extra, calculado no backend) ou NONE (sem carga).
 */
export type LoadType = 'EXTERNAL' | 'BODYWEIGHT' | 'NONE';

export interface NextWorkoutExerciseDTO {
  name: string;
  sets: number | null;
  reps: string | null;
}

/** Referência curta a outro usuário. */
export interface UserRefDTO {
  id: string;
  name: string;
  avatarUrl: string | null;
}

/** Dia da faixa da semana do Início. */
export interface HomeWeekDayDTO {
  /** YYYY-MM-DD. */
  date: string;
  trained: boolean;
  today: boolean;
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
  /** Treinos no mês corrente (redesign). */
  monthSessions?: number;
  /** Volume (reps × carga) dos últimos 7 dias, hoje incluso. */
  volume7dKg?: number;
  /** Os 7 dias da semana corrente. */
  week?: HomeWeekDayDTO[];
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

export interface UpdateWeightRequestDTO {
  newWeight: number;
}

// ── Social ─────────────────────────────────────────────────────────────────

export type PresenceStatus = 'TRAINING' | 'ONLINE' | 'OFFLINE';
export type ConnectionState = 'NONE' | 'PENDING_OUTGOING' | 'PENDING_INCOMING' | 'CONNECTED';
export type PostIntensity = 'LEVE' | 'MODERADO' | 'ALTA';

export interface SquadMember {
  id: string;
  nome: string;
  avatarUrl: string | null;
  status: PresenceStatus;
  hasNewUpdate: boolean;
}

export interface FeedAuthor {
  id: string;
  nome: string;
  avatarUrl: string | null;
}

export interface FeedPostData {
  id: string;
  author: FeedAuthor;
  timestamp: string;
  category: string;
  imageUrl: string | null;
  duration: string;
  calories: string;
  badge?: string | null;
  likesCount: number;
  commentsCount: number;
  caption: string;
  isLikedByMe: boolean;
  createdAt: string;
  // ── Treino ligado ao post (redesign; nulos/vazios em post sem treino ou backend antigo) ──
  title?: string | null;
  durationSeconds?: number | null;
  volumeKg?: number | null;
  recordsCount?: number;
  /** Até 3 exercícios com a melhor série. */
  exercises?: WorkoutExerciseSummary[];
  /** Quantos exercícios ficaram fora de `exercises`. */
  moreExercises?: number;
}

/** Melhor série: maior carga (empate → mais repetições). Carga 0 = peso corporal. */
export interface BestSet {
  weightKg: number;
  reps: number;
}

export interface WorkoutExerciseSummary {
  name: string;
  setsCount: number;
  bestSet: BestSet | null;
}

export interface Story {
  id: string;
  imageUrl: string | null;
  caption: string | null;
  createdAt: string;
  /** ISO — momento em que a story expira (createdAt + 24h). */
  expiresAt: string;
}

/** Stories de um mesmo autor, agrupadas para o anel/visualizador estilo Instagram. */
export interface StoryGroup {
  userId: string;
  nome: string;
  avatarUrl: string | null;
  stories: Story[];
}

export interface CreateStoryRequest {
  imageUrl: string;
  caption?: string;
}

export interface UserCard {
  id: string;
  nome: string;
  avatarUrl: string | null;
  connectionState: ConnectionState;
}

export interface PendingRequest {
  connectionId: string;
  /** Id de quem enviou — usado para aceitar/recusar (accept/remove operam por id de usuário). */
  requesterId: string;
  nome: string;
  avatarUrl: string | null;
  requestedAt: string;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  body: string;
  createdAt: string;
}

export interface CreatePostRequest {
  category?: string;
  intensity?: PostIntensity;
  durationMinutes?: number;
  calories?: number;
  caption?: string;
  imageUrl?: string;
  badge?: string;
  /** Mesmo id enviado em /sessions/log: liga o post ao treino (volume, tempo, título). */
  clientSessionId?: string;
  /** Id da sessão já salva (ex.: escolhida no histórico de 7 dias do NewPostModal). */
  workoutSessionId?: string;
}

export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  last: boolean;
}

export interface UserProfileResponse {
  fullName: string;
  email: string;
  /** Celular (DDD + número, sem +55); null em contas antigas. Usado no atalho de WhatsApp. */
  phone: string | null;
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

/** Lado oposto de um vínculo personal↔aluno (para o aluno, é o personal). */
export interface TrainerPeer {
  id: string;
  nome: string;
  email: string;
  avatarUrl: string | null;
  /** Celular (DDD + número) — só vem com vínculo ATIVO; null se não cadastrado. */
  phone: string | null;
}

/** Vínculo personal↔aluno — espelha TrainerLinkDTO do backend. */
/** GET /api/me/protocol: protocolo e anamnese, com quem registrou por último. */
export interface StudentProtocol {
  goal: string | null;
  level: string | null;
  frequency: number | null;
  medicalConditions: string | null;
  /** Personal com vínculo ativo: ele define o protocolo e o aluno só confere. Null = o aluno edita. */
  managedByName: string | null;
  protocolUpdatedAt: string | null;
  protocolUpdatedByName: string | null;
  protocolUpdatedByStudent: boolean;
  anamnesisUpdatedAt: string | null;
  anamnesisUpdatedByName: string | null;
  anamnesisUpdatedByStudent: boolean;
  /** Quando o aluno conferiu a anamnese; null = ainda não conferiu a versão atual. */
  anamnesisConfirmedAt: string | null;
}

export interface TrainerLink {
  id: string;
  peer: TrainerPeer;
  status: 'PENDENTE' | 'ATIVO' | 'RECUSADO' | 'ENCERRADO';
  source: 'INVITE' | 'COMPANY' | 'INVITE_CODE';
  createdAt: string;
  respondedAt: string | null;
}

// ─── Perfil público e "Comparar progresso" (redesign P3) ─────────────────────

export interface PersonalRecord {
  exercise: string;
  weightKg: number;
  reps: number;
  /** YYYY-MM-DD */
  date: string;
}

export interface Achievement {
  /** FIRST_WORKOUT | WORKOUTS_10 | WORKOUTS_50 | WORKOUTS_100 | STREAK_7 | STREAK_30 | VOLUME_10T | VOLUME_100T | VOLUME_1000T */
  code: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt: string | null;
  progress: number;
  target: number;
}

/** Perfil de um usuário visto por outro. Com `locked` (não é amigo) as listas vêm vazias. */
export interface PublicProfile {
  id: string;
  name: string;
  avatarUrl: string | null;
  /** YYYY-MM-DD */
  memberSince: string | null;
  isMe: boolean;
  connectionState: ConnectionState | 'SELF';
  locked: boolean;
  postsCount: number;
  friendsCount: number;
  workoutsCount: number;
  streakDays: number;
  /** Início (domingo) de cada uma das 12 semanas, mais antiga primeiro. */
  weekStarts: string[];
  weeklyMinutes: number[];
  records: PersonalRecord[];
  achievements: Achievement[];
}

/** Sessão de treino resumida (aba "Treinos" do perfil). */
export interface WorkoutSummary {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  title: string | null;
  durationSeconds: number | null;
  volumeKg: number;
  recordsCount: number;
  exercises: WorkoutExerciseSummary[];
  moreExercises: number;
}

/** Um lado do "Comparar progresso" — só dados de treino. */
export interface CompareSide {
  id: string;
  name: string;
  avatarUrl: string | null;
  weeklyMinutes: number[];
  monthSessions: number;
  streakDays: number;
  totalSessions: number;
  volume30dKg: number;
}

export interface SharedPr {
  exercise: string;
  me: BestSet;
  friend: BestSet;
}

export interface CompareProgress {
  weekStarts: string[];
  me: CompareSide;
  friend: CompareSide;
  sharedPrs: SharedPr[];
}

// ─── Perfil profissional do personal (redesign P5) ───────────────────────────

export interface TrainerEducation {
  title: string;
  /** Ex.: "UFMG · 2018". */
  detail: string | null;
}

/** Perfil público do personal. `updatedAt` nulo = ainda não preenchido. */
export interface TrainerPublicProfile {
  trainerId: string;
  nome: string;
  avatarUrl: string | null;
  phone: string | null;
  cref: string | null;
  crefVerified: boolean;
  bio: string | null;
  specialties: string[];
  education: TrainerEducation[];
  modality: string | null;
  schedule: string | null;
  location: string | null;
  updatedAt: string | null;
}

/** Ficha vigente montada pelo personal para o aluno. */
export interface TrainerPlanItem {
  id: string;
  title: string;
  subtitle: string | null;
  tag: string | null;
  exerciseCount: number;
  createdAt: string;
}

/** Tela "Seu personal": GET /api/me/trainer/profile (404 = sem personal ativo). */
export interface MyTrainerProfile {
  linkId: string;
  linkSource: 'INVITE' | 'COMPANY' | 'INVITE_CODE';
  /** False quando o vínculo foi atribuído pela empresa. */
  canEndLink: boolean;
  linkedSince: string | null;
  trainer: TrainerPublicProfile;
  activePlanCount: number;
  /** Ficha mais recente que o personal montou (vigente ou arquivada). */
  lastReviewAt: string | null;
  plans: TrainerPlanItem[];
}

/** Avaliação física registrada pelo personal (GET /me/assessments). */
export interface PhysicalAssessmentDTO {
  id: string;
  assessedOn: string;
  weightKg: number | null;
  heightCm: number | null;
  bodyFatPct: number | null;
  muscleMassKg: number | null;
  restingHr: number | null;
  waistCm: number | null;
  hipCm: number | null;
  notes: string | null;
  bmi: number | null;
  trainerName: string | null;
}
