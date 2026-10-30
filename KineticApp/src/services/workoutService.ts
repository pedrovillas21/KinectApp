import api from './api';
import type { GenerateWorkoutRequest } from '../types';

/**
 * Gera a ficha por IA (onboarding e regeneração no Protocolo). O backend tenta até N modelos
 * com 120s de read timeout cada: 3 modelos × 120s + 60s de buffer = 420s; 480s dá folga.
 */
export const generateWorkout = (payload: GenerateWorkoutRequest) =>
  api.post('/workouts/generate', payload, { timeout: 480000 });
