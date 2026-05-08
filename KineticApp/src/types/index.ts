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

export interface HomeDashboardResponseDTO {
  completedSessions: number;
  targetSessions: number;
  efficiencyPercentage: number;
}

export interface UpdateWeightRequestDTO {
  newWeight: number;
}
