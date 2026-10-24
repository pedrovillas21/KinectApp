import api from './api';
import type { TrainerProfile, TrainerProfileInput } from '../types';

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
