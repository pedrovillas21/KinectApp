import api from './api';
import type { Feedback } from '../types';

/**
 * Feedbacks recebidos pela empresa (/api/empresa/feedbacks). A elegibilidade
 * (só vínculos source=COMPANY geram feedback) é aplicada no backend; o front
 * apenas rotula/explica. O envio (aluno→empresa) fica para a frente mobile.
 */
export const listCompanyFeedbacks = async (): Promise<Feedback[]> => {
  const res = await api.get<Feedback[]>('/empresa/feedbacks');
  return res.data;
};
