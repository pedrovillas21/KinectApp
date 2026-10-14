import api from './api';
import type {
  MonthlyStatsResponseDTO,
  PlanEvolutionResponseDTO,
  StatsPeriodId,
  StatsSummaryResponseDTO,
  TrainerLink,
  WorkoutPlan,
  WorkoutPlanInput,
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

// ── Fichas do aluno ──────────────────────────────────────────────────────────
// Erros esperados: 404 = sem vínculo ATIVO ou ficha inexistente/já removida;
// 400 = validação (o corpo é a mensagem em texto, pronta para exibir).

/** Fichas vigentes do aluno, no mesmo formato que o app recebe. */
export const listStudentPlans = async (studentId: string): Promise<WorkoutPlan[]> => {
  const res = await api.get<WorkoutPlan[]>(`/trainer/students/${studentId}/plans`);
  return res.data;
};

/** Cria uma ficha; aparece na hora no app do aluno. */
export const createStudentPlan = async (
  studentId: string,
  plan: WorkoutPlanInput,
): Promise<WorkoutPlan> => {
  const res = await api.post<WorkoutPlan>(`/trainer/students/${studentId}/plans`, plan);
  return res.data;
};

/** Substitui o conteúdo da ficha; exercícios omitidos são arquivados no backend. */
export const updateStudentPlan = async (
  studentId: string,
  planId: string,
  plan: WorkoutPlanInput,
): Promise<WorkoutPlan> => {
  const res = await api.put<WorkoutPlan>(`/trainer/students/${studentId}/plans/${planId}`, plan);
  return res.data;
};

/** Tira a ficha do app do aluno (arquiva; o histórico de sessões é mantido). */
export const archiveStudentPlan = async (studentId: string, planId: string): Promise<void> => {
  await api.delete(`/trainer/students/${studentId}/plans/${planId}`);
};
