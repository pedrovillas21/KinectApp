-- Duracao media estimada pela IA (Gemini) para concluir a ficha, em minutos.
-- Nullable: fichas geradas antes desta feature ficam NULL e usam o fallback
-- heuristico (max(20, round(totalSets * 1.2))) calculado no WorkoutPlanResponseDTO.
ALTER TABLE workout_plans ADD COLUMN IF NOT EXISTS estimated_duration_minutes INTEGER;
