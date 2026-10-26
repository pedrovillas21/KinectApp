import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import type { MyTrainerProfile, StudentProtocol, TrainerLink } from '../types';

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

/** Perfil profissional do personal ativo + fichas dele; null quando não há vínculo (404). */
export const getMyTrainerProfile = async (): Promise<MyTrainerProfile | null> => {
  try {
    const res = await api.get<MyTrainerProfile>('/me/trainer/profile');
    return res.data;
  } catch (e) {
    const err = e as { response?: { status?: number } };
    if (err.response?.status === 404) return null;
    throw e;
  }
};

/** Protocolo e anamnese do aluno logado (com personal, é ele quem define). */
export const getMyProtocol = async (): Promise<StudentProtocol> => {
  const res = await api.get<StudentProtocol>('/me/protocol');
  return res.data;
};

/** "Está tudo certo": o aluno confirma a anamnese registrada. */
export const confirmMyAnamnesis = async (): Promise<StudentProtocol> => {
  const res = await api.post<StudentProtocol>('/me/protocol/anamnesis/confirm');
  return res.data;
};

/**
 * O aluno encerra o vínculo: o personal perde o acesso aos dados dele; o histórico
 * de treinos fica. Vale também para o vínculo atribuído pela empresa.
 */
export const endMyTrainerLink = async (): Promise<void> => {
  await api.delete('/me/trainer');
};

// ── Código de convite (link do personal) ─────────────────────────────────────

/**
 * Resgata o código do link de convite. Digitar o código é o aceite: o vínculo
 * já volta ATIVO. Erros: 402 = plano do personal cheio; 404 = código
 * inválido/vencido/usado; 409 = já tem personal.
 */
export const redeemInviteCode = async (code: string): Promise<TrainerLink> => {
  const res = await api.post<TrainerLink>('/me/invite-codes/redeem', { code: code.trim() });
  return res.data;
};

/** Mensagem amigável para uma falha de resgate (o backend manda o texto no corpo em 404/409). */
export const redeemErrorMessage = (e: unknown): string => {
  const err = e as { response?: { status?: number; data?: unknown } };
  const raw = err.response?.data;
  const status = err.response?.status;
  // 402 = o plano do personal está cheio (o código continua valendo para depois).
  if ((status === 400 || status === 402 || status === 404 || status === 409) && typeof raw === 'string' && raw) {
    return raw;
  }
  return 'Não foi possível usar o código agora. Tente novamente em instantes.';
};

// Código digitado no cadastro: guardado até o primeiro login (o cadastro exige
// confirmar o e-mail antes, então ainda não há sessão para resgatar na hora).
// Vai junto o e-mail de quem se cadastrou: num aparelho compartilhado, o código só
// é resgatado por essa conta, nunca pela próxima que entrar.
const PENDING_INVITE_KEY = '@kinetic_pending_invite';
const LEGACY_PENDING_INVITE_KEY = '@kinetic_pending_invite_code';

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const savePendingInviteCode = (code: string, email: string) =>
  AsyncStorage.setItem(PENDING_INVITE_KEY, JSON.stringify({ code: code.trim(), email: normalizeEmail(email) }));

/** Código pendente desta conta; null se não houver ou se for de outra conta. */
export const getPendingInviteCode = async (email: string): Promise<string | null> => {
  // Formato antigo (sem dono): descartado, pois não dá para saber de quem era.
  await AsyncStorage.removeItem(LEGACY_PENDING_INVITE_KEY);
  const raw = await AsyncStorage.getItem(PENDING_INVITE_KEY);
  if (!raw) return null;
  try {
    const saved = JSON.parse(raw) as { code?: string; email?: string };
    return saved.code && saved.email === normalizeEmail(email) ? saved.code : null;
  } catch {
    await AsyncStorage.removeItem(PENDING_INVITE_KEY);
    return null;
  }
};

export const clearPendingInviteCode = () => AsyncStorage.removeItem(PENDING_INVITE_KEY);
