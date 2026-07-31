import api from './api';
import type { TrainerLink } from '../types';

/**
 * Vínculo personal↔aluno (Fase 1 do painel do personal).
 * Endpoints do lado do ALUNO: convites recebidos e "quem é meu personal".
 */

export const getPendingInvites = async (): Promise<TrainerLink[]> => {
  const res = await api.get<TrainerLink[]>('/me/invites');
  return res.data;
};

export const acceptInvite = async (inviteId: string): Promise<TrainerLink> => {
  const res = await api.post<TrainerLink>(`/me/invites/${inviteId}/accept`);
  return res.data;
};

export const declineInvite = async (inviteId: string): Promise<void> => {
  await api.post(`/me/invites/${inviteId}/decline`);
};

/** Personal ativo do aluno, ou null quando não há vínculo (backend responde 404). */
export const getMyTrainer = async (): Promise<TrainerLink | null> => {
  try {
    const res = await api.get<TrainerLink>('/me/trainer');
    return res.data;
  } catch (e) {
    const err = e as { response?: { status?: number } };
    if (err.response?.status === 404) return null;
    throw e;
  }
};
