import api from './api';
import { compressImage } from '../utils/compressImage';
import type { CompareProgress, Page, PublicProfile, WorkoutSummary } from '../types';

/**
 * Perfil público de outro usuário e "Comparar progresso".
 * Erros: 403 = não é amigo aceito (listas/compare); 404 = usuário não existe;
 * 400 = comparar consigo mesmo.
 */

export const getPublicProfile = async (userId: string): Promise<PublicProfile> => {
  const res = await api.get<PublicProfile>(`/social/users/${userId}/profile`);
  return res.data;
};

export const getUserWorkouts = async (userId: string, page = 0, size = 10): Promise<Page<WorkoutSummary>> => {
  const res = await api.get<Page<WorkoutSummary>>(`/social/users/${userId}/workouts`, { params: { page, size } });
  return res.data;
};

export const getCompareProgress = async (friendId: string): Promise<CompareProgress> => {
  const res = await api.get<CompareProgress>(`/social/compare/${friendId}`);
  return res.data;
};

/** Status HTTP de um erro do axios, ou undefined. */
export const httpStatus = (e: unknown): number | undefined =>
  (e as { response?: { status?: number } }).response?.status;

/**
 * Troca a foto de perfil do usuário logado e devolve o endereço público novo.
 * A foto é pública (bucket próprio), diferente das fotos de posts.
 */
export const updateMyAvatar = async (originalUri: string): Promise<string> => {
  const uri = await compressImage(originalUri);
  const name = uri.split('/').pop() ?? `${Date.now()}.jpg`;
  const ext = (/\.(\w+)$/.exec(name)?.[1] ?? 'jpg').toLowerCase();
  const type = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  const form = new FormData();
  form.append('file', { uri, name, type } as any);
  const res = await api.put<{ avatarUrl: string }>('/users/me/avatar', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.avatarUrl;
};

/** Remove a foto de perfil (volta às iniciais do nome). */
export const removeMyAvatar = async (): Promise<void> => {
  await api.delete('/users/me/avatar');
};
