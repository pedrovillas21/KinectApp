import api from './api';
import type { TrainerCompany, TrainerProfile, TrainerProfileInput } from '../types';

/**
 * Perfil profissional do personal logado — o que os alunos vinculados veem em
 * "Seu personal" no app. 400 = validação (corpo em texto, pronto para exibir).
 */

export const getMyTrainerProfile = async (): Promise<TrainerProfile> => {
  const res = await api.get<TrainerProfile>('/trainer/profile');
  return res.data;
};

export const saveMyTrainerProfile = async (input: TrainerProfileInput): Promise<TrainerProfile> => {
  const res = await api.put<TrainerProfile>('/trainer/profile', input);
  return res.data;
};

/** Troca a foto de perfil (mesmo endpoint do app) e devolve o endereço público novo. */
export const updateMyAvatar = async (file: File): Promise<string> => {
  const form = new FormData();
  form.append('file', file);
  const res = await api.put<{ avatarUrl: string }>('/users/me/avatar', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.avatarUrl;
};

/** Remove a foto de perfil (volta às iniciais do nome). */
export const removeMyAvatar = async (): Promise<void> => {
  await api.delete('/users/me/avatar');
};

// ── Empresa do personal ─────────────────────────────────────────────────────

/** Empresa da qual o personal é funcionário e convite que aguarda o aceite dele. */
export const getMyCompany = async (): Promise<TrainerCompany> => {
  const res = await api.get<TrainerCompany>('/trainer/company');
  return res.data;
};

export const acceptCompanyInvite = async (): Promise<TrainerCompany> => {
  const res = await api.post<TrainerCompany>('/trainer/company/accept');
  return res.data;
};

export const declineCompanyInvite = async (): Promise<void> => {
  await api.post('/trainer/company/decline');
};

/** Sai da empresa: volta à cobrança individual e encerra os alunos atribuídos por ela. */
export const leaveCompany = async (): Promise<void> => {
  await api.delete('/trainer/company');
};
