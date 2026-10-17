import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import api from './api';

/**
 * LGPD: exportar os próprios dados (JSON) e excluir a conta.
 * DELETE responde 204; senha errada volta 400 "Senha incorreta." (não 401,
 * para o interceptor não tratar como sessão expirada).
 */

/** Baixa o export, grava em cache e abre a folha de compartilhamento do sistema. */
export const exportMyData = async (): Promise<void> => {
  const res = await api.get<unknown>('/users/me/export');
  const date = new Date().toISOString().slice(0, 10);
  const file = new File(Paths.cache, `kinetic-dados-${date}.json`);
  if (file.exists) file.delete();
  file.write(JSON.stringify(res.data, null, 2));
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Compartilhamento indisponível neste aparelho.');
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Exportar meus dados',
    UTI: 'public.json',
  });
};

/** Exclui a conta de forma definitiva. Lança erro com a mensagem do backend quando houver. */
export const deleteMyAccount = async (password: string): Promise<void> => {
  await api.delete('/users/me', { data: { password } });
};

/** Mensagem amigável de uma falha (o backend manda o texto no corpo em 400). */
export const accountErrorMessage = (e: unknown, fallback: string): string => {
  const err = e as { response?: { status?: number; data?: unknown } };
  const raw = err.response?.data;
  if (err.response?.status === 400 && typeof raw === 'string' && raw) return raw;
  if (err.response?.status === 400 && raw && typeof raw === 'object' && 'message' in raw) {
    const message = (raw as { message?: unknown }).message;
    if (typeof message === 'string' && message) return message;
  }
  return fallback;
};
