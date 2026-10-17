import api from './api';
import type { AssessmentInput, PhysicalAssessment } from '../types';

/**
 * Avaliações físicas do aluno (exigem vínculo ATIVO; 404 sem posse).
 * 400 = validação (corpo em texto, pronto para exibir).
 */

/** Da mais antiga para a mais recente. */
export const listAssessments = async (studentId: string): Promise<PhysicalAssessment[]> => {
  const res = await api.get<PhysicalAssessment[]>(`/trainer/students/${studentId}/assessments`);
  return res.data;
};

export const createAssessment = async (studentId: string, input: AssessmentInput): Promise<PhysicalAssessment> => {
  const res = await api.post<PhysicalAssessment>(`/trainer/students/${studentId}/assessments`, input);
  return res.data;
};

export const updateAssessment = async (
  studentId: string,
  assessmentId: string,
  input: AssessmentInput,
): Promise<PhysicalAssessment> => {
  const res = await api.put<PhysicalAssessment>(`/trainer/students/${studentId}/assessments/${assessmentId}`, input);
  return res.data;
};

export const deleteAssessment = async (studentId: string, assessmentId: string): Promise<void> => {
  await api.delete(`/trainer/students/${studentId}/assessments/${assessmentId}`);
};
