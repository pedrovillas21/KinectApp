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
