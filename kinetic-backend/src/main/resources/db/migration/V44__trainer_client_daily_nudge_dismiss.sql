-- "Ignorar" o lembrete do dia ("ainda não treinou hoje") na fila de hoje do personal.
ALTER TABLE trainer_clients ADD COLUMN daily_nudge_dismissed_on DATE;
