import api from './api';

/**
 * Dados da própria conta (/api/users/...), válidos para qualquer papel logado.
 * Hoje o painel só usa o celular (atalho de WhatsApp com os alunos).
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
