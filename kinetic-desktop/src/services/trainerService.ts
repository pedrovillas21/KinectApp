import api from './api';
import type {
  MonthlyStatsResponseDTO,
  PlanEvolutionResponseDTO,
  StatsPeriodId,
  StatsSummaryResponseDTO,
  TrainerLink,
} from '../types';

/**
 * Endpoints do lado do PERSONAL (GET/POST /api/trainer/...).
 * Todos exigem papel PERSONAL no JWT; o backend responde 403 caso contrário.
 */

/** Alunos com vínculo ATIVO na carteira do personal logado. */
export const listStudents = async (): Promise<TrainerLink[]> => {
  const res = await api.get<TrainerLink[]>('/trainer/students');
  return res.data;
};

/**
 * Convida um aluno pelo e-mail. Erros esperados do backend:
 * 404 = aluno não cadastrado; 409 = aluno já tem personal ativo (ou convite
 * pendente duplicado). Trate-os na UI com mensagens amigáveis.
 */
export const inviteStudent = async (studentEmail: string): Promise<TrainerLink> => {
  const res = await api.post<TrainerLink>('/trainer/invites', { studentEmail });
  return res.data;
};

/** Resumo de estatísticas do aluno no período (exige vínculo ATIVO; 404 sem posse). */
export const getStudentStats = async (
  studentId: string,
  period: StatsPeriodId = 'month',
): Promise<StatsSummaryResponseDTO> => {
  const res = await api.get<StatsSummaryResponseDTO>(
    `/trainer/students/${studentId}/stats`,
    { params: { period } },
  );
  return res.data;
};

/** Ciclo atual vs. anterior do aluno (exige vínculo ATIVO; 404 sem posse). */
export const getStudentPlanEvolution = async (
  studentId: string,
): Promise<PlanEvolutionResponseDTO> => {
  const res = await api.get<PlanEvolutionResponseDTO>(
    `/trainer/students/${studentId}/plan-evolution`,
  );
  return res.data;
};

/** Estatísticas do mês corrente do aluno (exige vínculo ATIVO; 404 sem posse). */
export const getStudentMonthlyStats = async (
  studentId: string,
): Promise<MonthlyStatsResponseDTO> => {
  const res = await api.get<MonthlyStatsResponseDTO>(
    `/trainer/students/${studentId}/monthly-stats`,
  );
  return res.data;
};
