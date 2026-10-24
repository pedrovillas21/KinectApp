/**
 * Limites de uma série registrada. Espelham kinetic-backend
 * (com.kinetic.utils.SetLimits): o backend recusa o que passar daqui.
 */
export const MAX_REPS = 100;
export const MAX_WEIGHT_KG = 500;
/** 1RM estimado (Epley) acima do recorde humano em qualquer exercício. */
const MAX_ESTIMATED_1RM_KG = 600;

/** Mensagem de erro, ou null quando a série é plausível. */
export function validateSet(reps: number, weightKg: number): string | null {
  if (!Number.isInteger(reps) || reps < 1) return 'Insira pelo menos 1 repetição.';
  if (reps > MAX_REPS) return `O máximo é ${MAX_REPS} repetições por série.`;
  if (Number.isNaN(weightKg) || weightKg < 0) return 'O peso não pode ser negativo.';
  if (weightKg > MAX_WEIGHT_KG) return `O máximo é ${MAX_WEIGHT_KG} kg por série.`;
  if (weightKg > 0 && weightKg * (1 + reps / 30) > MAX_ESTIMATED_1RM_KG) {
    return `${reps} repetições com ${weightKg} kg está fora do possível. Confira os valores.`;
  }
  return null;
}
