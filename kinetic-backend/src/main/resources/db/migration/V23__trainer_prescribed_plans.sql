-- Fichas prescritas pelo personal no painel desktop.

-- Autor da ficha quando ela foi montada por um personal. NULL = gerada por IA no app.
-- ON DELETE SET NULL: excluir a conta do personal nao pode levar junto o treino do aluno.
ALTER TABLE workout_plans
    ADD COLUMN IF NOT EXISTS created_by_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Observacoes do personal por exercicio (execucao, cadencia, ajustes).
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS notes TEXT;

-- Ordem de exibicao dentro da ficha. NULL em fichas antigas (ordem de insercao).
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS sort_order INTEGER;

-- Exercicio removido da ficha pelo personal. Soft-delete obrigatorio: exercise_set_logs
-- referenciam o exercicio (apagar a linha destruiria o historico do aluno) e um aluno
-- no meio da sessao ainda envia series do exercicio removido.
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE;
