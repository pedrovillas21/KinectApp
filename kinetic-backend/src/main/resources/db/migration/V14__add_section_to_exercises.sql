-- Secao logica do exercicio dentro da ficha: AQUECIMENTO | PRINCIPAL | FINALIZACAO.
-- Classificada pela IA (Gemini) na geracao e usada pelo app para agrupar os
-- exercicios da tela de detalhe da ficha. Nullable: exercicios gerados antes desta
-- feature ficam NULL e o front os agrupa como "Treino principal" (fallback).
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS section VARCHAR(32);
