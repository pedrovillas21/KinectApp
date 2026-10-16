import api from './api';
import type { BillingOverview } from '../types';

/**
 * Assinatura do personal no Kinetic (GET/POST /api/trainer/billing).
 * Erros esperados: 400 = plano inválido/menor que a carteira (corpo em texto);
 * 502 = falha ao falar com o gateway de pagamento.
 */

/** Situação do plano + catálogo. A primeira chamada inicia o teste grátis. */
export const getBilling = async (): Promise<BillingOverview> => {
  const res = await api.get<BillingOverview>('/trainer/billing');
  return res.data;
};

/** Assina (devolve checkoutUrl da 1ª cobrança) ou troca de plano (vale na hora). */
export const subscribePlan = async (plan: string): Promise<BillingOverview> => {
  const res = await api.post<BillingOverview>('/trainer/billing/subscribe', { plan });
  return res.data;
};

export const cancelSubscription = async (): Promise<BillingOverview> => {
  const res = await api.post<BillingOverview>('/trainer/billing/cancel');
  return res.data;
};

/** Só no modo demo: simula o pagamento da cobrança em aberto. */
export const confirmDemoPayment = async (): Promise<BillingOverview> => {
  const res = await api.post<BillingOverview>('/trainer/billing/demo/confirm-payment');
  return res.data;
};

export { formatBRL } from '../utils/money';

export const formatDate = (iso: string | null): string =>
  iso ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' }) : '';

/** Dias inteiros até `iso` (0 = hoje ou já passou). */
export const daysUntil = (iso: string | null): number =>
  iso ? Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)) : 0;

/** Texto de erro vindo do backend (corpo em texto), com fallback. */
export const billingErrorMessage = (err: unknown, fallback: string): string => {
  const data = (err as { response?: { data?: unknown } }).response?.data;
  return typeof data === 'string' && data ? data : fallback;
};
