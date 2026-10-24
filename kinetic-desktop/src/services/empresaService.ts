import api from './api';
import type {
  EmpresaAnalytics,
  EmpresaStudentLink,
  StatsPeriodId,
  TrainerLink,
  UserAdmin,
} from '../types';

/**
 * Endpoints da EMPRESA (/api/empresa/...), escopados pela company_id do usuário
 * logado no backend. Exigem papel EMPRESA no JWT (403 caso contrário).
 */

// ── Funcionários (personais) ──────────────────────────────────────────────────

export const listFuncionarios = async (): Promise<UserAdmin[]> => {
  const res = await api.get<UserAdmin[]>('/empresa/personais');
  return res.data;
};

export const vincularFuncionario = async (email: string): Promise<UserAdmin> => {
  const res = await api.post<UserAdmin>('/empresa/personais', { email });
  return res.data;
};

export const desvincularFuncionario = async (personalId: string): Promise<void> => {
  await api.delete(`/empresa/personais/${personalId}`);
};

// ── Clientes (alunos) ─────────────────────────────────────────────────────────

export const listClientes = async (): Promise<EmpresaStudentLink[]> => {
  const res = await api.get<EmpresaStudentLink[]>('/empresa/alunos');
  return res.data;
};

export const vincularAluno = async (
  studentEmail: string,
  trainerEmail: string,
): Promise<TrainerLink> => {
  const res = await api.post<TrainerLink>('/empresa/alunos', { studentEmail, trainerEmail });
  return res.data;
};

export const desvincularAluno = async (linkId: string): Promise<void> => {
  await api.delete(`/empresa/alunos/${linkId}`);
};

// ── Analytics ─────────────────────────────────────────────────────────────────

export const getAnalytics = async (
  period: StatsPeriodId = 'month',
): Promise<EmpresaAnalytics> => {
  const res = await api.get<EmpresaAnalytics>('/empresa/analytics', { params: { period } });
  return res.data;
};
