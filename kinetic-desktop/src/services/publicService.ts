import api from './api';
import type { InviteCodePreview } from '../types';

/** Rotas sem login (GET /api/public/...). */

/** Dono do link de convite. 404 = código inválido, vencido ou já usado. */
export const getInvitePreview = async (code: string): Promise<InviteCodePreview> => {
  const res = await api.get<InviteCodePreview>(`/public/invite-codes/${encodeURIComponent(code)}`);
  return res.data;
};
