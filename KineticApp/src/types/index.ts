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

export interface VolumeByMuscleGroupDTO {
  muscleGroup: string;
  volume: number;
}

export interface WeightPointDTO {
  date: string; // ISO format YYYY-MM-DD
  weight: number;
}

export interface StatsSummaryResponseDTO {
  needsWeightUpdate: boolean;
  efficiencyPercentage: number;
  completedSessions: number;
  targetSessions: number;
  volumeByMuscleGroup: VolumeByMuscleGroupDTO[];
  weightHistory: WeightPointDTO[];
}

export interface HomeDashboardResponseDTO {
  completedSessions: number;
  targetSessions: number;
  efficiencyPercentage: number;
}

export interface UpdateWeightRequestDTO {
  newWeight: number;
}
