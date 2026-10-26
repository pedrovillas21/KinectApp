import api from './api';
import type {
  Company,
  Page,
  RootMetrics,
  StatsPeriodId,
  UserAdmin,
  UserStatus,
} from '../types';

/**
 * Endpoints do ROOT (/api/root/...). Todos exigem papel ROOT no JWT; o backend
 * responde 403 caso contrário.
 */

export const getMetrics = async (period: StatsPeriodId = 'month'): Promise<RootMetrics> => {
  const res = await api.get<RootMetrics>('/root/metrics', { params: { period } });
  return res.data;
};

export const listCompanies = async (page = 0, size = 50): Promise<Page<Company>> => {
  const res = await api.get<Page<Company>>('/root/companies', { params: { page, size } });
  return res.data;
};

/** Rede de empresas + dono. A senha do dono é gerada pelo backend e vai ao e-mail dele. */
export interface CreateCompanyPayload {
  companyName: string;
  companyCnpj: string;
  /** Apelido da rede: prefixo do usuário das filiais (apelido.filial). */
  slug: string;
  ownerName: string;
  ownerEmail: string;
}

export const createCompany = async (payload: CreateCompanyPayload): Promise<Company> => {
  const res = await api.post<Company>('/root/companies', payload);
  return res.data;
};

/** Gera outra senha para um dono ou filial (vai por e-mail; as sessões caem). */
export const regeneratePassword = async (userId: string): Promise<void> => {
  await api.post(`/root/users/${userId}/nova-senha`);
};

/** Apaga o app autenticador de um dono ou filial: o próximo login volta ao cadastro do app. */
export const resetSecondFactor = async (userId: string): Promise<void> => {
  await api.post(`/root/users/${userId}/reset-2fa`);
};

export const listPersonais = async (status?: UserStatus): Promise<UserAdmin[]> => {
  const res = await api.get<UserAdmin[]>('/root/personais', {
    params: status ? { status } : undefined,
  });
  return res.data;
};

export interface CreatePersonalPayload {
  nome: string;
  email: string;
  senha: string;
  /** Celular com ou sem máscara; obrigatório (atalho de WhatsApp com os alunos). */
  phone: string;
  companyId?: string | null;
}

export const createPersonal = async (payload: CreatePersonalPayload): Promise<UserAdmin> => {
  const res = await api.post<UserAdmin>('/root/personais', payload);
  return res.data;
};

export const listUsers = async (
  role?: UserAdmin['role'],
  status?: UserStatus,
): Promise<UserAdmin[]> => {
  const params: Record<string, string> = {};
  if (role) params.role = role;
  if (status) params.status = status;
  const res = await api.get<UserAdmin[]>('/root/users', { params });
  return res.data;
};

export const setUserStatus = async (id: string, status: UserStatus): Promise<UserAdmin> => {
  const res = await api.patch<UserAdmin>(`/root/users/${id}/status`, { status });
  return res.data;
};

/**
 * Exclusão definitiva, a pedido do titular (LGPD art. 18 VI): a mesma do app, para quem
 * não consegue entrar. Para só tirar o acesso, use o status BLOQUEADO.
 */
export const deleteUser = async (id: string): Promise<void> => {
  await api.delete(`/root/users/${id}/permanent`);
};
