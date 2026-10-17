-- Endurecimento de integridade a partir da auditoria das migrations V7–V24.
--
-- Antes de escrever esta migration, as linhas existentes foram conferidas contra todos
-- os CHECKs abaixo (nenhuma violação) e os TIMESTAMP sem fuso foram confirmados em UTC.
--
-- Ficaram de fora de propósito, porque quebrariam a aplicação:
-- - Índice único "1 plano ativo por usuário": o aluno tem um CONJUNTO de fichas ativas
--   (A/B/C). O índice arquivaria fichas e barraria geração e aprovação de várias fichas.
-- - FK users.active_session_id -> workout_sessions: o campo guarda um UUID de presença
--   gerado pelo PresenceService, não o id de uma sessão de treino.
-- - Trigger que apaga refresh_tokens ao suspender/bloquear: o CompanyService já revoga,
--   e o delete feito pelo trigger deixava o delete do Hibernate sem linhas (StaleStateException).

-- ----------------------------------------------------------------------------
-- 1. ON DELETE nas FKs que ainda não tinham regra
-- ----------------------------------------------------------------------------

-- Snapshot é dado do aluno, como as demais tabelas filhas de users (todas em CASCADE).
ALTER TABLE plan_cycle_snapshots
    DROP CONSTRAINT IF EXISTS plan_cycle_snapshots_user_id_fkey,
    ADD CONSTRAINT plan_cycle_snapshots_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Excluir uma empresa desvincula usuários e vínculos em vez de travar o delete.
ALTER TABLE users
    DROP CONSTRAINT IF EXISTS users_company_id_fkey,
    ADD CONSTRAINT users_company_id_fkey
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;

ALTER TABLE trainer_clients
    DROP CONSTRAINT IF EXISTS trainer_clients_company_id_fkey,
    ADD CONSTRAINT trainer_clients_company_id_fkey
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;

-- ----------------------------------------------------------------------------
-- 2. TIMESTAMP -> TIMESTAMP WITH TIME ZONE (V7 a V24)
-- ----------------------------------------------------------------------------
-- Os valores atuais foram gravados em UTC, então são reinterpretados como UTC.
-- O ALTER TYPE reconstrói sozinho os índices que usam essas colunas.

ALTER TABLE plan_cycle_snapshots
    ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE USING created_at AT TIME ZONE 'UTC';

ALTER TABLE users
    ALTER COLUMN last_active TYPE TIMESTAMP WITH TIME ZONE USING last_active AT TIME ZONE 'UTC';

ALTER TABLE user_connections
    ALTER COLUMN created_at   TYPE TIMESTAMP WITH TIME ZONE USING created_at AT TIME ZONE 'UTC',
    ALTER COLUMN responded_at TYPE TIMESTAMP WITH TIME ZONE USING responded_at AT TIME ZONE 'UTC';

ALTER TABLE social_posts
    ALTER COLUMN expires_at TYPE TIMESTAMP WITH TIME ZONE USING expires_at AT TIME ZONE 'UTC',
    ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE USING created_at AT TIME ZONE 'UTC';

ALTER TABLE post_likes
    ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE USING created_at AT TIME ZONE 'UTC';

ALTER TABLE post_comments
    ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE USING created_at AT TIME ZONE 'UTC';

ALTER TABLE companies
    ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE USING created_at AT TIME ZONE 'UTC';

ALTER TABLE trainer_clients
    ALTER COLUMN created_at   TYPE TIMESTAMP WITH TIME ZONE USING created_at AT TIME ZONE 'UTC',
    ALTER COLUMN responded_at TYPE TIMESTAMP WITH TIME ZONE USING responded_at AT TIME ZONE 'UTC';

ALTER TABLE chat_messages
    ALTER COLUMN sent_at TYPE TIMESTAMP WITH TIME ZONE USING sent_at AT TIME ZONE 'UTC',
    ALTER COLUMN read_at TYPE TIMESTAMP WITH TIME ZONE USING read_at AT TIME ZONE 'UTC';

ALTER TABLE feedbacks
    ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE USING created_at AT TIME ZONE 'UTC';

-- Mesmos defaults das outras tabelas (a aplicação continua preenchendo os dois).
ALTER TABLE ai_plan_generations
    ALTER COLUMN id SET DEFAULT gen_random_uuid(),
    ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE USING created_at AT TIME ZONE 'UTC',
    ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
    ALTER COLUMN approved_at TYPE TIMESTAMP WITH TIME ZONE USING approved_at AT TIME ZONE 'UTC';

-- ----------------------------------------------------------------------------
-- 3. CHECKs de domínio e de tamanho
-- ----------------------------------------------------------------------------
-- Os limites de texto acompanham a validação dos DTOs; o banco é a última barreira.

ALTER TABLE users
    ADD CONSTRAINT chk_users_role   CHECK (role IN ('ALUNO', 'PERSONAL', 'EMPRESA', 'ROOT')),
    ADD CONSTRAINT chk_users_status CHECK (status IN ('ATIVO', 'SUSPENSO', 'BLOQUEADO'));

ALTER TABLE workout_plans
    ADD CONSTRAINT chk_workout_plans_estimated_duration
        CHECK (estimated_duration_minutes IS NULL OR estimated_duration_minutes BETWEEN 1 AND 600);

ALTER TABLE exercises
    ADD CONSTRAINT chk_exercises_section
        CHECK (section IS NULL OR section IN ('AQUECIMENTO', 'PRINCIPAL', 'FINALIZACAO')),
    ADD CONSTRAINT chk_exercises_notes_length CHECK (notes IS NULL OR char_length(notes) <= 2000),
    ADD CONSTRAINT chk_exercises_sort_order   CHECK (sort_order IS NULL OR sort_order >= 0);

ALTER TABLE plan_cycle_snapshots
    ADD CONSTRAINT chk_snapshot_volume_json_length
        CHECK (volume_by_muscle IS NULL OR char_length(volume_by_muscle) <= 10000),
    ADD CONSTRAINT chk_snapshot_adherence_range
        CHECK (adherence_percentage IS NULL OR adherence_percentage BETWEEN 0 AND 100),
    ADD CONSTRAINT chk_snapshot_dates_order CHECK (cycle_end_date >= cycle_start_date);

ALTER TABLE user_connections
    ADD CONSTRAINT chk_user_connections_status
        CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'BLOCKED'));

-- image_url guarda só a storage key (V22). Sem "..", sem "/" inicial: a key é usada
-- para assinar URLs do bucket e não pode apontar para fora da pasta esperada.
ALTER TABLE social_posts
    ADD CONSTRAINT chk_post_caption_length CHECK (caption IS NULL OR char_length(caption) <= 2200),
    ADD CONSTRAINT chk_post_kind           CHECK (kind IN ('POST', 'STORY')),
    ADD CONSTRAINT chk_post_metrics_positive
        CHECK ((duration_minutes IS NULL OR duration_minutes >= 0)
           AND (calories IS NULL OR calories >= 0)),
    ADD CONSTRAINT chk_post_storage_key_safe
        CHECK (image_url IS NULL OR (
            position('..' IN image_url) = 0
            AND left(image_url, 1) <> '/'
            AND char_length(image_url) <= 512));

ALTER TABLE post_comments
    ADD CONSTRAINT chk_comment_body_length CHECK (char_length(body) BETWEEN 1 AND 2000);

ALTER TABLE trainer_clients
    ADD CONSTRAINT chk_trainer_clients_status
        CHECK (status IN ('PENDENTE', 'ATIVO', 'ENCERRADO', 'RECUSADO', 'INATIVO')),
    ADD CONSTRAINT chk_trainer_clients_source CHECK (source IN ('INVITE', 'COMPANY'));

ALTER TABLE chat_messages
    ADD CONSTRAINT chk_chat_messages_content_length CHECK (char_length(content) BETWEEN 1 AND 4000);

ALTER TABLE feedbacks
    ADD CONSTRAINT chk_feedbacks_no_self_review   CHECK (student_id <> personal_id),
    ADD CONSTRAINT chk_feedbacks_content_length   CHECK (char_length(content) BETWEEN 1 AND 3000);

-- Uma aprovação só vale com a versão aprovada e o texto da declaração aceita gravados.
ALTER TABLE ai_plan_generations
    ADD CONSTRAINT chk_ai_gen_no_self_prescribe
        CHECK (trainer_id IS NULL OR student_id IS NULL OR trainer_id <> student_id),
    ADD CONSTRAINT chk_ai_gen_status CHECK (status IN ('PREVIEW', 'APPROVED')),
    ADD CONSTRAINT chk_ai_gen_approval_completeness
        CHECK (status <> 'APPROVED' OR (
            approved_at IS NOT NULL
            AND approved_plans IS NOT NULL
            AND char_length(trim(coalesce(declaration_text, ''))) > 0)),
    ADD CONSTRAINT chk_ai_gen_payload_limits
        CHECK (char_length(prompt) BETWEEN 1 AND 10000
           AND (options IS NULL OR char_length(options) <= 5000)
           AND char_length(ai_output) <= 200000
           AND (approved_plans IS NULL OR char_length(approved_plans) <= 200000)
           AND (declaration_text IS NULL OR char_length(declaration_text) <= 5000));

-- ----------------------------------------------------------------------------
-- 4. Índices nas FKs sem índice (evitam varrer a tabela inteira em CASCADE/SET NULL)
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_post_comments_post_created ON post_comments (post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id      ON post_comments (user_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id         ON post_likes (user_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_workout_session
    ON social_posts (workout_session_id) WHERE workout_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users (company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id    ON chat_messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_recipient_id ON chat_messages (recipient_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_student_id       ON feedbacks (student_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_personal_id      ON feedbacks (personal_id);
CREATE INDEX IF NOT EXISTS idx_workout_plans_created_by
    ON workout_plans (created_by_id) WHERE created_by_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_workout_plans_ai_generation_id
    ON workout_plans (ai_generation_id) WHERE ai_generation_id IS NOT NULL;
-- trainer_id já é coberto por idx_ai_plan_generations_trainer_student (coluna inicial).
CREATE INDEX IF NOT EXISTS idx_ai_plan_generations_student_id
    ON ai_plan_generations (student_id) WHERE student_id IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 5. Registro de aprovação imutável
-- ----------------------------------------------------------------------------
-- Depois de APPROVED, a linha é o registro de que o personal validou o treino: nada do
-- conteúdo muda. A única alteração aceita é trainer_id/student_id virarem NULL, que é o
-- ON DELETE SET NULL da exclusão de uma conta.

CREATE OR REPLACE FUNCTION fn_protect_approved_ai_generation()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'APPROVED' AND (
           NEW.status <> 'APPROVED'
        OR NEW.prompt           IS DISTINCT FROM OLD.prompt
        OR NEW.options          IS DISTINCT FROM OLD.options
        OR NEW.ai_output        IS DISTINCT FROM OLD.ai_output
        OR NEW.model            IS DISTINCT FROM OLD.model
        OR NEW.created_at       IS DISTINCT FROM OLD.created_at
        OR NEW.approved_at      IS DISTINCT FROM OLD.approved_at
        OR NEW.approved_plans   IS DISTINCT FROM OLD.approved_plans
        OR NEW.declaration_text IS DISTINCT FROM OLD.declaration_text
        OR NEW.replaced_current IS DISTINCT FROM OLD.replaced_current
        OR (NEW.trainer_id IS NOT NULL AND NEW.trainer_id IS DISTINCT FROM OLD.trainer_id)
        OR (NEW.student_id IS NOT NULL AND NEW.student_id IS DISTINCT FROM OLD.student_id)
    ) THEN
        RAISE EXCEPTION 'Geração de IA aprovada (id=%) é imutável: é o registro da aprovação.', OLD.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_approved_ai_generation ON ai_plan_generations;
CREATE TRIGGER trg_protect_approved_ai_generation
    BEFORE UPDATE ON ai_plan_generations
    FOR EACH ROW
    EXECUTE FUNCTION fn_protect_approved_ai_generation();

-- Só o trigger chama a função; ninguém precisa de EXECUTE direto.
REVOKE ALL ON FUNCTION fn_protect_approved_ai_generation() FROM PUBLIC;

-- ----------------------------------------------------------------------------
-- 6. PostgREST do Supabase (complemento da V21)
-- ----------------------------------------------------------------------------

DO $$
BEGIN
    -- `anon` / `authenticated` só existem no Supabase; em Postgres local o bloco é pulado.
    IF (SELECT count(*) = 2 FROM pg_roles WHERE rolname IN ('anon', 'authenticated')) THEN
        EXECUTE 'REVOKE ALL ON public.ai_plan_generations FROM anon, authenticated';
        EXECUTE 'REVOKE ALL ON FUNCTION public.fn_protect_approved_ai_generation() FROM anon, authenticated';
        -- A V21 fez o mesmo para tabelas e sequences; aqui, para funções futuras.
        EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public '
             || 'REVOKE ALL ON FUNCTIONS FROM anon, authenticated';
    END IF;
END $$;
