import api from './api';
import type { FinanceOverview, PaymentMethod } from '../types';

/**
 * Financeiro do personal (GET/PUT/POST /api/trainer/finance).
 * Erros esperados: 400 = validação (corpo em texto); 404 = aluno/cobrança fora da carteira.
 */

/** month = "AAAA-MM"; sem mês, o atual. Também gera as cobranças do mês que faltam. */
export const getFinance = async (month?: string): Promise<FinanceOverview> => {
  const res = await api.get<FinanceOverview>('/trainer/finance', { params: month ? { month } : {} });
  return res.data;
};

export const savePixKey = async (pixKey: string): Promise<void> => {
  await api.put('/trainer/finance/settings', { pixKey });
};

export const setStudentPlan = async (studentId: string, amountCents: number, dueDay: number): Promise<void> => {
  await api.put(`/trainer/finance/students/${studentId}/plan`, { amountCents, dueDay });
};

export const removeStudentPlan = async (studentId: string): Promise<void> => {
  await api.delete(`/trainer/finance/students/${studentId}/plan`);
};

export const payCharge = async (chargeId: string, method: PaymentMethod, paidAt?: string): Promise<void> => {
  await api.post(`/trainer/finance/charges/${chargeId}/pay`, { method, paidAt: paidAt || null });
};

export const waiveCharge = async (chargeId: string): Promise<void> => {
  await api.post(`/trainer/finance/charges/${chargeId}/waive`);
};

export const reopenCharge = async (chargeId: string): Promise<void> => {
  await api.post(`/trainer/finance/charges/${chargeId}/reopen`);
};

export const PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
  { id: 'PIX', label: 'Pix' },
  { id: 'DINHEIRO', label: 'Dinheiro' },
  { id: 'CARTAO', label: 'Cartão' },
  { id: 'TRANSFERENCIA', label: 'Transferência' },
  { id: 'OUTRO', label: 'Outro' },
];
