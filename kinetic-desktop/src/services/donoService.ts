import api from './api';
import type {
  EmpresaAnalytics,
  EmpresaStudentLink,
  Feedback,
  Network,
  StatsPeriodId,
  Unit,
  UnitInput,
  UserAdmin,
} from '../types';

/**
 * Endpoints do DONO da rede (/api/dono/...): cadastro das filiais e acompanhamento.
 * O dia a dia (personais e alunos) é de cada filial, que entra por usuário rede.filial.
 */

export const getNetwork = async (): Promise<Network> => (await api.get<Network>('/dono/rede')).data;

export const getNetworkAnalytics = async (period: StatsPeriodId = 'month'): Promise<EmpresaAnalytics> =>
  (await api.get<EmpresaAnalytics>('/dono/analytics', { params: { period } })).data;

export const listUnits = async (): Promise<Unit[]> => (await api.get<Unit[]>('/dono/unidades')).data;

/** Cria a filial; a senha gerada vai ao e-mail do responsável. */
export const createUnit = async (input: UnitInput): Promise<Unit> =>
  (await api.post<Unit>('/dono/unidades', input)).data;

export const updateUnit = async (id: string, input: UnitInput): Promise<Unit> =>
  (await api.put<Unit>(`/dono/unidades/${id}`, input)).data;

export const setUnitActive = async (id: string, active: boolean): Promise<Unit> =>
  (await api.patch<Unit>(`/dono/unidades/${id}/status`, { active })).data;

export const regenerateUnitPassword = async (id: string): Promise<void> => {
  await api.post(`/dono/unidades/${id}/nova-senha`);
};

export const resetUnitSecondFactor = async (id: string): Promise<void> => {
  await api.post(`/dono/unidades/${id}/reset-2fa`);
};

export const getUnitAnalytics = async (id: string, period: StatsPeriodId): Promise<EmpresaAnalytics> =>
  (await api.get<EmpresaAnalytics>(`/dono/unidades/${id}/analytics`, { params: { period } })).data;

export const listUnitFuncionarios = async (id: string): Promise<UserAdmin[]> =>
  (await api.get<UserAdmin[]>(`/dono/unidades/${id}/funcionarios`)).data;

export const listUnitClientes = async (id: string): Promise<EmpresaStudentLink[]> =>
  (await api.get<EmpresaStudentLink[]>(`/dono/unidades/${id}/clientes`)).data;

export const listUnitFeedbacks = async (id: string): Promise<Feedback[]> =>
  (await api.get<Feedback[]>(`/dono/unidades/${id}/feedbacks`)).data;
