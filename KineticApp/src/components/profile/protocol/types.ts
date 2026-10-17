/** Dados do protocolo editados localmente e enviados ao regenerar o treino com IA. */
export interface ProtocolForm {
  goal: string;
  weight: number;
  height: number;
  birthDate: string; // ISO YYYY-MM-DD
  level: string;
  frequency: number;
  medicalConditions: string;
}
