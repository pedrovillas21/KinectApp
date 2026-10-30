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

/** Cobra um pacote extra de IA (devolve aiPackCheckoutUrl); reaproveita o pendente, se houver. */
export const buyAiPack = async (): Promise<BillingOverview> => {
  const res = await api.post<BillingOverview>('/trainer/billing/ai-pack');
  return res.data;
};

/** No plano Grátis com a carteira acima do limite: quem continua editável (o resto congela). */
export const chooseActiveStudents = async (studentIds: string[]): Promise<BillingOverview> => {
  const res = await api.put<BillingOverview>('/trainer/billing/active-students', studentIds);
  return res.data;
};

/** Só no modo demo: simula o pagamento do pacote de IA em aberto. */
export const confirmDemoAiPack = async (): Promise<BillingOverview> => {
  const res = await api.post<BillingOverview>('/trainer/billing/demo/confirm-ai-pack');
  return res.data;
};

/**
 * Total de fichas com IA do período: cota do plano + extras ainda no saldo + extras já gastos
 * neste período (o que passou da cota), para o total não encolher conforme o uso. null = sem cota.
 */
export const aiTotalLimit = (b: BillingOverview): number | null =>
  b.aiGenerationsLimit === null
    ? null
    : b.aiGenerationsLimit + b.aiExtraCredits + Math.max(0, b.aiGenerationsUsed - b.aiGenerationsLimit);
