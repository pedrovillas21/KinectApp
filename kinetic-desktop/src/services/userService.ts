import api from './api';

/**
 * Dados da própria conta (/api/users/...), válidos para qualquer papel logado:
 * celular (atalho de WhatsApp com os alunos), aceite dos termos e os direitos do
 * titular (baixar os dados, excluir a conta).
 */

export const getMyPhone = async (): Promise<string | null> => {
  const res = await api.get<{ phone: string | null }>('/users/profile');
  return res.data.phone ?? null;
};

/** Aceita com ou sem máscara; o backend devolve só DDD + número. */
export const updateMyPhone = async (phone: string): Promise<string> => {
  const res = await api.put<{ phone: string }>('/users/phone', { phone });
  return res.data.phone;
};

/** false: a conta ainda não aceitou a versão vigente dos Termos/Política (a API fica barrada). */
export const getTermsAccepted = async (): Promise<boolean> => {
  const res = await api.get<{ termsAccepted?: boolean }>('/users/profile');
  return res.data.termsAccepted !== false;
};

export const acceptTerms = async (): Promise<void> => {
  await api.post('/users/me/terms-acceptance');
};

/** Cópia completa dos dados da conta (LGPD art. 18), baixada como JSON. */
export const downloadMyData = async (): Promise<void> => {
  const res = await api.get('/users/me/export', { responseType: 'blob' });
  const url = URL.createObjectURL(res.data as Blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kinetic-meus-dados-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const deleteMyAccount = async (password: string): Promise<void> => {
  await api.delete('/users/me', { data: { password } });
};
