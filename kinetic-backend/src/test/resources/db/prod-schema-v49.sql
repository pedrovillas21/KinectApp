-- Schema de produção na V49 (pg_dump só de estrutura, sem dados): base dos testes de
-- integração. O Flyway faz baseline na 49 e aplica as migrations seguintes, como no deploy.
-- Quando produção avançar: novo dump com as mesmas remoções (CREATE SCHEMA public,
-- flyway_schema_history, \restrict) e o baseline-version novo em application-test.properties.

-- Papéis que o Supabase já tem e que as migrations citam em GRANT/REVOKE.
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.11
-- Dumped by pg_dump version 17.11 (Debian 17.11-1.pgdg13+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: fn_protect_approved_ai_generation(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_protect_approved_ai_generation() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: access_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.access_logs (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    ip character varying(45) NOT NULL,
    event character varying(16) NOT NULL,
    accessed_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT access_logs_event_check CHECK (((event)::text = ANY ((ARRAY['LOGIN'::character varying, 'REFRESH'::character varying, 'ACCESS'::character varying])::text[])))
);


--
-- Name: access_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.access_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: access_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.access_logs_id_seq OWNED BY public.access_logs.id;


--
-- Name: ai_plan_generations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_plan_generations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    trainer_id uuid,
    student_id uuid,
    prompt text NOT NULL,
    options text,
    ai_output text NOT NULL,
    model character varying(80),
    status character varying(20) DEFAULT 'PREVIEW'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    approved_at timestamp with time zone,
    approved_plans text,
    declaration_text text,
    replaced_current boolean,
    trainer_name character varying(255),
    trainer_cref character varying(40),
    student_ref_hash character varying(64),
    retain_until date,
    CONSTRAINT chk_ai_gen_approval_completeness CHECK ((((status)::text <> 'APPROVED'::text) OR ((approved_at IS NOT NULL) AND (approved_plans IS NOT NULL) AND (char_length(TRIM(BOTH FROM COALESCE(declaration_text, ''::text))) > 0)))),
    CONSTRAINT chk_ai_gen_no_self_prescribe CHECK (((trainer_id IS NULL) OR (student_id IS NULL) OR (trainer_id <> student_id))),
    CONSTRAINT chk_ai_gen_payload_limits CHECK (((char_length(prompt) >= 1) AND (char_length(prompt) <= 10000) AND ((options IS NULL) OR (char_length(options) <= 5000)) AND (char_length(ai_output) <= 200000) AND ((approved_plans IS NULL) OR (char_length(approved_plans) <= 200000)) AND ((declaration_text IS NULL) OR (char_length(declaration_text) <= 5000)))),
    CONSTRAINT chk_ai_gen_status CHECK (((status)::text = ANY (ARRAY[('PREVIEW'::character varying)::text, ('APPROVED'::character varying)::text])))
);


--
-- Name: billing_webhook_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.billing_webhook_events (
    event_id character varying(100) NOT NULL,
    received_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: companies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.companies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    cnpj character varying(20)
);


--
-- Name: deleted_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deleted_accounts (
    user_id uuid NOT NULL,
    role character varying(16) NOT NULL,
    email character varying(255),
    nome character varying(255),
    cpf character varying(20),
    phone character varying(20),
    email_hash character varying(64) NOT NULL,
    cpf_hash character varying(64),
    terms_version character varying(32),
    terms_accepted_at timestamp with time zone,
    gateway_customer_id character varying(64),
    blocked boolean DEFAULT false NOT NULL,
    deleted_by character varying(16) NOT NULL,
    deleted_at timestamp with time zone DEFAULT now() NOT NULL,
    identity_until date NOT NULL,
    retain_until date NOT NULL,
    CONSTRAINT deleted_accounts_deleted_by_check CHECK (((deleted_by)::text = ANY ((ARRAY['TITULAR'::character varying, 'ADMIN'::character varying])::text[])))
);


--
-- Name: email_verification_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_verification_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    code_hash character varying(100) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT email_verification_codes_attempts_check CHECK ((attempts >= 0))
);


--
-- Name: exercise_set_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exercise_set_logs (
    id uuid NOT NULL,
    logged_at timestamp(6) without time zone NOT NULL,
    reps_performed integer NOT NULL,
    set_number integer NOT NULL,
    weight_used double precision NOT NULL,
    exercise_id uuid NOT NULL,
    session_id uuid NOT NULL
);


--
-- Name: exercises; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exercises (
    id uuid NOT NULL,
    muscles character varying(255),
    name character varying(255) NOT NULL,
    reps character varying(255),
    rest_time character varying(255),
    sets integer,
    type character varying(255),
    weight character varying(255),
    workout_plan_id uuid NOT NULL,
    section character varying(32),
    notes text,
    sort_order integer,
    archived boolean DEFAULT false NOT NULL,
    load_type character varying(16),
    CONSTRAINT chk_exercises_notes_length CHECK (((notes IS NULL) OR (char_length(notes) <= 2000))),
    CONSTRAINT chk_exercises_section CHECK (((section IS NULL) OR ((section)::text = ANY (ARRAY[('AQUECIMENTO'::character varying)::text, ('PRINCIPAL'::character varying)::text, ('FINALIZACAO'::character varying)::text])))),
    CONSTRAINT chk_exercises_sort_order CHECK (((sort_order IS NULL) OR (sort_order >= 0))),
    CONSTRAINT ck_exercises_load_type CHECK (((load_type IS NULL) OR ((load_type)::text = ANY (ARRAY[('EXTERNAL'::character varying)::text, ('BODYWEIGHT'::character varying)::text, ('NONE'::character varying)::text]))))
);


--
-- Name: feedbacks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feedbacks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    personal_id uuid NOT NULL,
    company_id uuid NOT NULL,
    content text NOT NULL,
    anonymous boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_feedbacks_content_length CHECK (((char_length(content) >= 1) AND (char_length(content) <= 3000))),
    CONSTRAINT chk_feedbacks_no_self_review CHECK ((student_id <> personal_id))
);


--
--



--
-- Name: password_reset_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    code_hash character varying(100) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT password_reset_codes_attempts_check CHECK ((attempts >= 0))
);


--
-- Name: physical_assessments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.physical_assessments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    trainer_id uuid,
    assessed_on date NOT NULL,
    weight_kg double precision,
    height_cm double precision,
    body_fat_pct double precision,
    muscle_mass_kg double precision,
    resting_hr integer,
    chest_cm double precision,
    waist_cm double precision,
    abdomen_cm double precision,
    hip_cm double precision,
    arm_right_cm double precision,
    arm_left_cm double precision,
    thigh_right_cm double precision,
    thigh_left_cm double precision,
    calf_right_cm double precision,
    calf_left_cm double precision,
    notes character varying(2000),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT physical_assessments_abdomen_cm_check CHECK (((abdomen_cm IS NULL) OR ((abdomen_cm >= (20)::double precision) AND (abdomen_cm <= (300)::double precision)))),
    CONSTRAINT physical_assessments_arm_left_cm_check CHECK (((arm_left_cm IS NULL) OR ((arm_left_cm >= (5)::double precision) AND (arm_left_cm <= (150)::double precision)))),
    CONSTRAINT physical_assessments_arm_right_cm_check CHECK (((arm_right_cm IS NULL) OR ((arm_right_cm >= (5)::double precision) AND (arm_right_cm <= (150)::double precision)))),
    CONSTRAINT physical_assessments_body_fat_pct_check CHECK (((body_fat_pct IS NULL) OR ((body_fat_pct >= (2)::double precision) AND (body_fat_pct <= (75)::double precision)))),
    CONSTRAINT physical_assessments_calf_left_cm_check CHECK (((calf_left_cm IS NULL) OR ((calf_left_cm >= (5)::double precision) AND (calf_left_cm <= (120)::double precision)))),
    CONSTRAINT physical_assessments_calf_right_cm_check CHECK (((calf_right_cm IS NULL) OR ((calf_right_cm >= (5)::double precision) AND (calf_right_cm <= (120)::double precision)))),
    CONSTRAINT physical_assessments_chest_cm_check CHECK (((chest_cm IS NULL) OR ((chest_cm >= (20)::double precision) AND (chest_cm <= (300)::double precision)))),
    CONSTRAINT physical_assessments_height_cm_check CHECK (((height_cm IS NULL) OR ((height_cm >= (80)::double precision) AND (height_cm <= (250)::double precision)))),
    CONSTRAINT physical_assessments_hip_cm_check CHECK (((hip_cm IS NULL) OR ((hip_cm >= (20)::double precision) AND (hip_cm <= (300)::double precision)))),
    CONSTRAINT physical_assessments_muscle_mass_kg_check CHECK (((muscle_mass_kg IS NULL) OR ((muscle_mass_kg >= (5)::double precision) AND (muscle_mass_kg <= (200)::double precision)))),
    CONSTRAINT physical_assessments_resting_hr_check CHECK (((resting_hr IS NULL) OR ((resting_hr >= 25) AND (resting_hr <= 220)))),
    CONSTRAINT physical_assessments_thigh_left_cm_check CHECK (((thigh_left_cm IS NULL) OR ((thigh_left_cm >= (10)::double precision) AND (thigh_left_cm <= (200)::double precision)))),
    CONSTRAINT physical_assessments_thigh_right_cm_check CHECK (((thigh_right_cm IS NULL) OR ((thigh_right_cm >= (10)::double precision) AND (thigh_right_cm <= (200)::double precision)))),
    CONSTRAINT physical_assessments_waist_cm_check CHECK (((waist_cm IS NULL) OR ((waist_cm >= (20)::double precision) AND (waist_cm <= (300)::double precision)))),
    CONSTRAINT physical_assessments_weight_kg_check CHECK (((weight_kg IS NULL) OR ((weight_kg >= (20)::double precision) AND (weight_kg <= (400)::double precision))))
);


--
-- Name: plan_cycle_snapshots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plan_cycle_snapshots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    cycle_start_date date NOT NULL,
    cycle_end_date date NOT NULL,
    goal character varying(255) NOT NULL,
    end_weight double precision,
    total_volume double precision,
    completed_sessions integer,
    target_sessions integer,
    adherence_percentage integer,
    volume_by_muscle text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_snapshot_adherence_range CHECK (((adherence_percentage IS NULL) OR ((adherence_percentage >= 0) AND (adherence_percentage <= 100)))),
    CONSTRAINT chk_snapshot_dates_order CHECK ((cycle_end_date >= cycle_start_date)),
    CONSTRAINT chk_snapshot_volume_json_length CHECK (((volume_by_muscle IS NULL) OR (char_length(volume_by_muscle) <= 10000)))
);


--
-- Name: post_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.post_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    user_id uuid NOT NULL,
    body text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_comment_body_length CHECK (((char_length(body) >= 1) AND (char_length(body) <= 2000)))
);


--
-- Name: post_likes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.post_likes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: rate_limit_counters; Type: TABLE; Schema: public; Owner: -
--

CREATE UNLOGGED TABLE public.rate_limit_counters (
    key text NOT NULL,
    window_end bigint NOT NULL,
    count integer NOT NULL
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refresh_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token_hash character varying(64) NOT NULL,
    expiry_date timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: shedlock; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shedlock (
    name character varying(64) NOT NULL,
    lock_until timestamp without time zone NOT NULL,
    locked_at timestamp without time zone NOT NULL,
    locked_by character varying(255) NOT NULL
);


--
-- Name: social_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.social_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    author_id uuid NOT NULL,
    workout_session_id uuid,
    kind character varying(16) DEFAULT 'POST'::character varying NOT NULL,
    category character varying(64),
    intensity character varying(16),
    duration_minutes integer,
    calories integer,
    caption text,
    image_url character varying(1024),
    badge character varying(64),
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_post_caption_length CHECK (((caption IS NULL) OR (char_length(caption) <= 2200))),
    CONSTRAINT chk_post_kind CHECK (((kind)::text = ANY (ARRAY[('POST'::character varying)::text, ('STORY'::character varying)::text]))),
    CONSTRAINT chk_post_metrics_positive CHECK ((((duration_minutes IS NULL) OR (duration_minutes >= 0)) AND ((calories IS NULL) OR (calories >= 0)))),
    CONSTRAINT chk_post_storage_key_safe CHECK (((image_url IS NULL) OR ((POSITION(('..'::text) IN (image_url)) = 0) AND ("left"((image_url)::text, 1) <> '/'::text) AND (char_length((image_url)::text) <= 512))))
);


--
-- Name: student_billing_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_billing_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    trainer_id uuid NOT NULL,
    student_id uuid NOT NULL,
    amount_cents integer NOT NULL,
    due_day smallint NOT NULL,
    active boolean DEFAULT true NOT NULL,
    starts_on date NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT student_billing_plans_amount_cents_check CHECK (((amount_cents > 0) AND (amount_cents <= 10000000))),
    CONSTRAINT student_billing_plans_due_day_check CHECK (((due_day >= 1) AND (due_day <= 28)))
);


--
-- Name: student_charges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_charges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    plan_id uuid,
    trainer_id uuid NOT NULL,
    student_id uuid,
    reference_month date NOT NULL,
    due_date date NOT NULL,
    amount_cents integer NOT NULL,
    status character varying(16) DEFAULT 'PENDENTE'::character varying NOT NULL,
    paid_at date,
    payment_method character varying(16),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    student_name character varying(255),
    retain_until date,
    CONSTRAINT chk_student_charges_method CHECK (((payment_method IS NULL) OR ((payment_method)::text = ANY (ARRAY[('PIX'::character varying)::text, ('DINHEIRO'::character varying)::text, ('CARTAO'::character varying)::text, ('TRANSFERENCIA'::character varying)::text, ('OUTRO'::character varying)::text])))),
    CONSTRAINT chk_student_charges_month_first_day CHECK ((EXTRACT(day FROM reference_month) = (1)::numeric)),
    CONSTRAINT chk_student_charges_retained CHECK (((student_id IS NOT NULL) OR ((student_name IS NOT NULL) AND (retain_until IS NOT NULL)))),
    CONSTRAINT chk_student_charges_status CHECK (((status)::text = ANY (ARRAY[('PENDENTE'::character varying)::text, ('PAGO'::character varying)::text, ('CANCELADO'::character varying)::text]))),
    CONSTRAINT student_charges_amount_cents_check CHECK ((amount_cents > 0))
);


--
-- Name: trainer_clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trainer_clients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    trainer_id uuid NOT NULL,
    student_id uuid NOT NULL,
    status character varying(16) DEFAULT 'PENDENTE'::character varying NOT NULL,
    source character varying(16) DEFAULT 'INVITE'::character varying NOT NULL,
    company_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    responded_at timestamp with time zone,
    ended_at timestamp without time zone,
    alerts_paused_until date,
    alert_pause_reason character varying(16),
    alert_pause_note character varying(500),
    alert_paused_at timestamp without time zone,
    daily_nudge_dismissed_on date,
    kept_on_downgrade boolean DEFAULT false NOT NULL,
    CONSTRAINT chk_no_self_link CHECK ((trainer_id <> student_id)),
    CONSTRAINT chk_trainer_clients_source CHECK (((source)::text = ANY (ARRAY[('INVITE'::character varying)::text, ('COMPANY'::character varying)::text, ('INVITE_CODE'::character varying)::text]))),
    CONSTRAINT chk_trainer_clients_status CHECK (((status)::text = ANY (ARRAY[('PENDENTE'::character varying)::text, ('ATIVO'::character varying)::text, ('ENCERRADO'::character varying)::text, ('RECUSADO'::character varying)::text, ('INATIVO'::character varying)::text]))),
    CONSTRAINT trainer_clients_alert_pause_reason_check CHECK (((alert_pause_reason IS NULL) OR ((alert_pause_reason)::text = ANY (ARRAY[('LESAO'::character varying)::text, ('VIAGEM'::character varying)::text, ('CONTATO'::character varying)::text, ('OUTRO'::character varying)::text]))))
);


--
-- Name: trainer_events; Type: TABLE; Schema: public; Owner: -
--

CREATE UNLOGGED TABLE public.trainer_events (
    id bigint NOT NULL,
    trainer_id uuid NOT NULL,
    type character varying(32) NOT NULL,
    student_id uuid,
    created_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL
);


--
-- Name: trainer_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE UNLOGGED SEQUENCE public.trainer_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: trainer_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.trainer_events_id_seq OWNED BY public.trainer_events.id;


--
-- Name: trainer_invite_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trainer_invite_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    trainer_id uuid NOT NULL,
    code_hash character varying(64) NOT NULL,
    label character varying(80),
    expires_at timestamp with time zone NOT NULL,
    redeemed_by uuid,
    redeemed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_invite_code_label_length CHECK (((label IS NULL) OR (char_length((label)::text) <= 80)))
);


--
-- Name: trainer_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trainer_profiles (
    user_id uuid NOT NULL,
    cref character varying(16),
    cref_verified boolean DEFAULT false NOT NULL,
    bio character varying(1500),
    specialties text[] DEFAULT '{}'::text[] NOT NULL,
    education text[] DEFAULT '{}'::text[] NOT NULL,
    modality character varying(80),
    schedule character varying(80),
    location character varying(80),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: trainer_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trainer_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    trainer_id uuid NOT NULL,
    plan character varying(16),
    status character varying(16) NOT NULL,
    trial_ends_at timestamp with time zone NOT NULL,
    current_period_end timestamp with time zone,
    canceled_at timestamp with time zone,
    gateway character varying(16),
    gateway_customer_id character varying(64),
    gateway_subscription_id character varying(64),
    checkout_url character varying(512),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ai_extra_credits integer DEFAULT 0 NOT NULL,
    ai_pack_payment_id character varying(64),
    ai_pack_checkout_url character varying(512),
    active_chosen_at timestamp with time zone,
    CONSTRAINT chk_trainer_subscriptions_plan CHECK (((plan IS NULL) OR ((plan)::text = ANY (ARRAY[('BASE'::character varying)::text, ('PRO'::character varying)::text, ('BUSINESS'::character varying)::text])))),
    CONSTRAINT chk_trainer_subscriptions_status CHECK (((status)::text = ANY (ARRAY[('TRIAL'::character varying)::text, ('PENDENTE'::character varying)::text, ('ATIVA'::character varying)::text, ('ATRASADA'::character varying)::text, ('CANCELADA'::character varying)::text]))),
    CONSTRAINT trainer_subscriptions_ai_extra_credits_check CHECK ((ai_extra_credits >= 0))
);


--
-- Name: user_connections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_connections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    requester_id uuid NOT NULL,
    addressee_id uuid NOT NULL,
    status character varying(16) DEFAULT 'PENDING'::character varying NOT NULL,
    requester_in_squad boolean DEFAULT true NOT NULL,
    addressee_in_squad boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    responded_at timestamp with time zone,
    CONSTRAINT chk_no_self_connection CHECK ((requester_id <> addressee_id)),
    CONSTRAINT chk_user_connections_status CHECK (((status)::text = ANY (ARRAY[('PENDING'::character varying)::text, ('ACCEPTED'::character varying)::text, ('REJECTED'::character varying)::text, ('BLOCKED'::character varying)::text])))
);


--
-- Name: user_login_streaks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_login_streaks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    login_date date NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    email character varying(255) NOT NULL,
    nome character varying(255) NOT NULL,
    senha character varying(255) NOT NULL,
    level character varying(255),
    birth_date date,
    frequency integer,
    goal character varying(255),
    height double precision,
    weight double precision,
    medical_conditions text,
    workout_onboarding_completed boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    avatar_url character varying(512),
    last_active timestamp with time zone,
    active_session_id uuid,
    role character varying(16) DEFAULT 'ALUNO'::character varying NOT NULL,
    company_id uuid,
    status character varying(16) DEFAULT 'ATIVO'::character varying NOT NULL,
    cpf character varying(20),
    email_verified boolean DEFAULT false NOT NULL,
    phone character varying(11),
    pix_key character varying(140),
    protocol_updated_at timestamp without time zone,
    protocol_updated_by_id uuid,
    anamnesis_updated_at timestamp without time zone,
    anamnesis_updated_by_id uuid,
    anamnesis_confirmed_at timestamp without time zone,
    terms_version character varying(32),
    terms_accepted_at timestamp with time zone,
    CONSTRAINT chk_users_phone_format CHECK (((phone IS NULL) OR ((phone)::text ~ '^[1-9]{2}9[0-9]{8}$'::text))),
    CONSTRAINT chk_users_role CHECK (((role)::text = ANY (ARRAY[('ALUNO'::character varying)::text, ('PERSONAL'::character varying)::text, ('EMPRESA'::character varying)::text, ('ROOT'::character varying)::text]))),
    CONSTRAINT chk_users_status CHECK (((status)::text = ANY (ARRAY[('ATIVO'::character varying)::text, ('SUSPENSO'::character varying)::text, ('BLOQUEADO'::character varying)::text])))
);


--
-- Name: weight_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.weight_history (
    id bigint NOT NULL,
    logged_at date NOT NULL,
    weight double precision NOT NULL,
    user_id uuid NOT NULL
);


--
-- Name: weight_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.weight_history ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.weight_history_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: workout_execution_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workout_execution_logs (
    id uuid NOT NULL,
    completion_date timestamp(6) without time zone NOT NULL,
    duration_minutes integer,
    user_id uuid NOT NULL,
    workout_plan_id uuid NOT NULL
);


--
-- Name: workout_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workout_plans (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    level character varying(255) NOT NULL,
    subtitle character varying(255),
    tag character varying(255),
    title character varying(255) NOT NULL,
    user_id uuid NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    estimated_duration_minutes integer,
    created_by_id uuid,
    ai_generation_id uuid,
    CONSTRAINT chk_workout_plans_estimated_duration CHECK (((estimated_duration_minutes IS NULL) OR ((estimated_duration_minutes >= 1) AND (estimated_duration_minutes <= 600))))
);


--
-- Name: workout_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workout_sessions (
    id uuid NOT NULL,
    duration_in_seconds integer NOT NULL,
    session_date date NOT NULL,
    user_id uuid NOT NULL,
    client_session_id uuid
);


--
-- Name: access_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.access_logs ALTER COLUMN id SET DEFAULT nextval('public.access_logs_id_seq'::regclass);


--
-- Name: trainer_events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trainer_events ALTER COLUMN id SET DEFAULT nextval('public.trainer_events_id_seq'::regclass);


--
-- Name: access_logs access_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.access_logs
    ADD CONSTRAINT access_logs_pkey PRIMARY KEY (id);


--
-- Name: ai_plan_generations ai_plan_generations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_plan_generations
    ADD CONSTRAINT ai_plan_generations_pkey PRIMARY KEY (id);


--
-- Name: billing_webhook_events billing_webhook_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_webhook_events
    ADD CONSTRAINT billing_webhook_events_pkey PRIMARY KEY (event_id);


--
-- Name: workout_sessions chk_workout_sessions_duration; Type: CHECK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE public.workout_sessions
    ADD CONSTRAINT chk_workout_sessions_duration CHECK (((duration_in_seconds >= 1) AND (duration_in_seconds <= 21600))) NOT VALID;


--
-- Name: companies companies_cnpj_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_cnpj_key UNIQUE (cnpj);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: deleted_accounts deleted_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deleted_accounts
    ADD CONSTRAINT deleted_accounts_pkey PRIMARY KEY (user_id);


--
-- Name: email_verification_codes email_verification_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_verification_codes
    ADD CONSTRAINT email_verification_codes_pkey PRIMARY KEY (id);


--
-- Name: email_verification_codes email_verification_codes_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_verification_codes
    ADD CONSTRAINT email_verification_codes_user_id_key UNIQUE (user_id);


--
-- Name: exercise_set_logs exercise_set_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercise_set_logs
    ADD CONSTRAINT exercise_set_logs_pkey PRIMARY KEY (id);


--
-- Name: exercises exercises_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercises
    ADD CONSTRAINT exercises_pkey PRIMARY KEY (id);


--
-- Name: feedbacks feedbacks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedbacks
    ADD CONSTRAINT feedbacks_pkey PRIMARY KEY (id);


--
--



--
-- Name: password_reset_codes password_reset_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_codes
    ADD CONSTRAINT password_reset_codes_pkey PRIMARY KEY (id);


--
-- Name: password_reset_codes password_reset_codes_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_codes
    ADD CONSTRAINT password_reset_codes_user_id_key UNIQUE (user_id);


--
-- Name: physical_assessments physical_assessments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.physical_assessments
    ADD CONSTRAINT physical_assessments_pkey PRIMARY KEY (id);


--
-- Name: plan_cycle_snapshots plan_cycle_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_cycle_snapshots
    ADD CONSTRAINT plan_cycle_snapshots_pkey PRIMARY KEY (id);


--
-- Name: post_comments post_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT post_comments_pkey PRIMARY KEY (id);


--
-- Name: post_likes post_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_pkey PRIMARY KEY (id);


--
-- Name: rate_limit_counters rate_limit_counters_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rate_limit_counters
    ADD CONSTRAINT rate_limit_counters_pkey PRIMARY KEY (key, window_end);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_hash_key UNIQUE (token_hash);


--
-- Name: shedlock shedlock_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shedlock
    ADD CONSTRAINT shedlock_pkey PRIMARY KEY (name);


--
-- Name: social_posts social_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_posts
    ADD CONSTRAINT social_posts_pkey PRIMARY KEY (id);


--
-- Name: student_billing_plans student_billing_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_billing_plans
    ADD CONSTRAINT student_billing_plans_pkey PRIMARY KEY (id);


--
-- Name: student_charges student_charges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_charges
    ADD CONSTRAINT student_charges_pkey PRIMARY KEY (id);


--
-- Name: trainer_clients trainer_clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trainer_clients
    ADD CONSTRAINT trainer_clients_pkey PRIMARY KEY (id);


--
-- Name: trainer_events trainer_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trainer_events
    ADD CONSTRAINT trainer_events_pkey PRIMARY KEY (id);


--
-- Name: trainer_invite_codes trainer_invite_codes_code_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trainer_invite_codes
    ADD CONSTRAINT trainer_invite_codes_code_hash_key UNIQUE (code_hash);


--
-- Name: trainer_invite_codes trainer_invite_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trainer_invite_codes
    ADD CONSTRAINT trainer_invite_codes_pkey PRIMARY KEY (id);


--
-- Name: trainer_profiles trainer_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trainer_profiles
    ADD CONSTRAINT trainer_profiles_pkey PRIMARY KEY (user_id);


--
-- Name: trainer_subscriptions trainer_subscriptions_ai_pack_payment_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trainer_subscriptions
    ADD CONSTRAINT trainer_subscriptions_ai_pack_payment_id_key UNIQUE (ai_pack_payment_id);


--
-- Name: trainer_subscriptions trainer_subscriptions_gateway_subscription_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trainer_subscriptions
    ADD CONSTRAINT trainer_subscriptions_gateway_subscription_id_key UNIQUE (gateway_subscription_id);


--
-- Name: trainer_subscriptions trainer_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trainer_subscriptions
    ADD CONSTRAINT trainer_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: trainer_subscriptions trainer_subscriptions_trainer_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trainer_subscriptions
    ADD CONSTRAINT trainer_subscriptions_trainer_id_key UNIQUE (trainer_id);


--
-- Name: users uk_6dotkott2kjsp8vw4d0m25fb7; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT uk_6dotkott2kjsp8vw4d0m25fb7 UNIQUE (email);


--
-- Name: user_login_streaks unique_user_login_date; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_login_streaks
    ADD CONSTRAINT unique_user_login_date UNIQUE (user_id, login_date);


--
-- Name: post_likes uq_post_like; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT uq_post_like UNIQUE (post_id, user_id);


--
-- Name: student_billing_plans uq_student_billing_plans_pair; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_billing_plans
    ADD CONSTRAINT uq_student_billing_plans_pair UNIQUE (trainer_id, student_id);


--
-- Name: student_charges uq_student_charges_plan_month; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_charges
    ADD CONSTRAINT uq_student_charges_plan_month UNIQUE (plan_id, reference_month);


--
-- Name: user_connections user_connections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_connections
    ADD CONSTRAINT user_connections_pkey PRIMARY KEY (id);


--
-- Name: user_login_streaks user_login_streaks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_login_streaks
    ADD CONSTRAINT user_login_streaks_pkey PRIMARY KEY (id);


--
-- Name: users users_cpf_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_cpf_key UNIQUE (cpf);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: weight_history weight_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weight_history
    ADD CONSTRAINT weight_history_pkey PRIMARY KEY (id);


--
-- Name: workout_execution_logs workout_execution_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workout_execution_logs
    ADD CONSTRAINT workout_execution_logs_pkey PRIMARY KEY (id);


--
-- Name: workout_plans workout_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workout_plans
    ADD CONSTRAINT workout_plans_pkey PRIMARY KEY (id);


--
-- Name: workout_sessions workout_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workout_sessions
    ADD CONSTRAINT workout_sessions_pkey PRIMARY KEY (id);


--
--



--
-- Name: idx_access_logs_accessed_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_access_logs_accessed_at ON public.access_logs USING btree (accessed_at);


--
-- Name: idx_access_logs_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_access_logs_user ON public.access_logs USING btree (user_id, accessed_at);


--
-- Name: idx_active_plan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_active_plan ON public.workout_plans USING btree (user_id, status) WHERE ((status)::text = 'active'::text);


--
-- Name: idx_ai_plan_generations_student_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_plan_generations_student_id ON public.ai_plan_generations USING btree (student_id) WHERE (student_id IS NOT NULL);


--
-- Name: idx_ai_plan_generations_trainer_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_plan_generations_trainer_created ON public.ai_plan_generations USING btree (trainer_id, created_at);


--
-- Name: idx_ai_plan_generations_trainer_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_plan_generations_trainer_student ON public.ai_plan_generations USING btree (trainer_id, student_id, created_at);


--
-- Name: idx_deleted_accounts_cpf_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_deleted_accounts_cpf_hash ON public.deleted_accounts USING btree (cpf_hash);


--
-- Name: idx_deleted_accounts_email_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_deleted_accounts_email_hash ON public.deleted_accounts USING btree (email_hash);


--
-- Name: idx_email_verification_codes_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_verification_codes_expires_at ON public.email_verification_codes USING btree (expires_at);


--
-- Name: idx_feedbacks_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_feedbacks_company ON public.feedbacks USING btree (company_id, created_at DESC);


--
-- Name: idx_feedbacks_personal_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_feedbacks_personal_id ON public.feedbacks USING btree (personal_id);


--
-- Name: idx_feedbacks_student_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_feedbacks_student_id ON public.feedbacks USING btree (student_id);


--
-- Name: idx_password_reset_codes_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_password_reset_codes_expires_at ON public.password_reset_codes USING btree (expires_at);


--
-- Name: idx_physical_assessments_student_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_physical_assessments_student_date ON public.physical_assessments USING btree (student_id, assessed_on);


--
-- Name: idx_plan_cycle_snapshots_user_cycle; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_plan_cycle_snapshots_user_cycle ON public.plan_cycle_snapshots USING btree (user_id, cycle_end_date DESC);


--
-- Name: idx_post_comments_post_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_post_comments_post_created ON public.post_comments USING btree (post_id, created_at);


--
-- Name: idx_post_comments_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_post_comments_user_id ON public.post_comments USING btree (user_id);


--
-- Name: idx_post_likes_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_post_likes_user_id ON public.post_likes USING btree (user_id);


--
-- Name: idx_refresh_tokens_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refresh_tokens_user_id ON public.refresh_tokens USING btree (user_id);


--
-- Name: idx_social_posts_active_stories; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_social_posts_active_stories ON public.social_posts USING btree (author_id, expires_at, created_at) WHERE ((kind)::text = 'STORY'::text);


--
-- Name: idx_social_posts_author_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_social_posts_author_created ON public.social_posts USING btree (author_id, created_at DESC);


--
-- Name: idx_social_posts_workout_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_social_posts_workout_session ON public.social_posts USING btree (workout_session_id) WHERE (workout_session_id IS NOT NULL);


--
-- Name: idx_student_charges_trainer_due; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_charges_trainer_due ON public.student_charges USING btree (trainer_id, due_date);


--
-- Name: idx_student_charges_trainer_month; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_charges_trainer_month ON public.student_charges USING btree (trainer_id, reference_month);


--
-- Name: idx_trainer_clients_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trainer_clients_student ON public.trainer_clients USING btree (student_id, status);


--
-- Name: idx_trainer_clients_trainer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trainer_clients_trainer ON public.trainer_clients USING btree (trainer_id, status);


--
-- Name: idx_trainer_invite_codes_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trainer_invite_codes_expires_at ON public.trainer_invite_codes USING btree (expires_at);


--
-- Name: idx_trainer_invite_codes_trainer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trainer_invite_codes_trainer ON public.trainer_invite_codes USING btree (trainer_id, redeemed_at);


--
-- Name: idx_user_connections_addressee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_connections_addressee ON public.user_connections USING btree (addressee_id, status);


--
-- Name: idx_user_connections_requester; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_connections_requester ON public.user_connections USING btree (requester_id, status);


--
-- Name: idx_users_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_company_id ON public.users USING btree (company_id) WHERE (company_id IS NOT NULL);


--
-- Name: idx_users_last_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_last_active ON public.users USING btree (last_active);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: idx_users_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_status ON public.users USING btree (status);


--
-- Name: idx_workout_plans_ai_generation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workout_plans_ai_generation_id ON public.workout_plans USING btree (ai_generation_id) WHERE (ai_generation_id IS NOT NULL);


--
-- Name: idx_workout_plans_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workout_plans_created_by ON public.workout_plans USING btree (created_by_id) WHERE (created_by_id IS NOT NULL);


--
-- Name: idx_workout_plans_user_ai_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workout_plans_user_ai_created ON public.workout_plans USING btree (user_id, created_at) WHERE (created_by_id IS NULL);


--
-- Name: uq_connection_pair; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_connection_pair ON public.user_connections USING btree (LEAST((requester_id)::text, (addressee_id)::text), GREATEST((requester_id)::text, (addressee_id)::text));


--
-- Name: uq_trainer_clients_one_active_per_student; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_trainer_clients_one_active_per_student ON public.trainer_clients USING btree (student_id) WHERE ((status)::text = 'ATIVO'::text);


--
-- Name: uq_trainer_clients_pending_pair; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_trainer_clients_pending_pair ON public.trainer_clients USING btree (trainer_id, student_id) WHERE ((status)::text = 'PENDENTE'::text);


--
-- Name: uq_users_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_users_phone ON public.users USING btree (phone) WHERE (phone IS NOT NULL);


--
-- Name: uq_workout_sessions_user_client_session; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_workout_sessions_user_client_session ON public.workout_sessions USING btree (user_id, client_session_id) WHERE (client_session_id IS NOT NULL);


--
-- Name: ai_plan_generations trg_protect_approved_ai_generation; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_protect_approved_ai_generation BEFORE UPDATE ON public.ai_plan_generations FOR EACH ROW EXECUTE FUNCTION public.fn_protect_approved_ai_generation();


--
-- Name: ai_plan_generations ai_plan_generations_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_plan_generations
    ADD CONSTRAINT ai_plan_generations_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: ai_plan_generations ai_plan_generations_trainer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_plan_generations
    ADD CONSTRAINT ai_plan_generations_trainer_id_fkey FOREIGN KEY (trainer_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: email_verification_codes email_verification_codes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_verification_codes
    ADD CONSTRAINT email_verification_codes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: feedbacks feedbacks_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedbacks
    ADD CONSTRAINT feedbacks_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: feedbacks feedbacks_personal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedbacks
    ADD CONSTRAINT feedbacks_personal_id_fkey FOREIGN KEY (personal_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: feedbacks feedbacks_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedbacks
    ADD CONSTRAINT feedbacks_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: exercise_set_logs fk3kd7ip66irtc1jwknckhberw0; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercise_set_logs
    ADD CONSTRAINT fk3kd7ip66irtc1jwknckhberw0 FOREIGN KEY (session_id) REFERENCES public.workout_sessions(id);


--
-- Name: workout_execution_logs fk4e8dge62k98nnj30hk12qm8f2; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workout_execution_logs
    ADD CONSTRAINT fk4e8dge62k98nnj30hk12qm8f2 FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: workout_plans fk4vr09ve028fenv5fb6e9akqlx; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workout_plans
    ADD CONSTRAINT fk4vr09ve028fenv5fb6e9akqlx FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: exercise_set_logs fkfff7pmnwtndw2mmu0nfvp06tn; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercise_set_logs
    ADD CONSTRAINT fkfff7pmnwtndw2mmu0nfvp06tn FOREIGN KEY (exercise_id) REFERENCES public.exercises(id);


--
-- Name: workout_sessions fkfwqciawyjntpphp080wpa37ge; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workout_sessions
    ADD CONSTRAINT fkfwqciawyjntpphp080wpa37ge FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: exercises fkh4e08pperhxhxusfh4cek8dak; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercises
    ADD CONSTRAINT fkh4e08pperhxhxusfh4cek8dak FOREIGN KEY (workout_plan_id) REFERENCES public.workout_plans(id);


--
-- Name: workout_execution_logs fkmdqpgx0un8evpkbn5yt986ens; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workout_execution_logs
    ADD CONSTRAINT fkmdqpgx0un8evpkbn5yt986ens FOREIGN KEY (workout_plan_id) REFERENCES public.workout_plans(id);


--
-- Name: weight_history fkrme7ln5w96sxk9j8pw6kmhary; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weight_history
    ADD CONSTRAINT fkrme7ln5w96sxk9j8pw6kmhary FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: password_reset_codes password_reset_codes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_codes
    ADD CONSTRAINT password_reset_codes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: physical_assessments physical_assessments_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.physical_assessments
    ADD CONSTRAINT physical_assessments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: physical_assessments physical_assessments_trainer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.physical_assessments
    ADD CONSTRAINT physical_assessments_trainer_id_fkey FOREIGN KEY (trainer_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: plan_cycle_snapshots plan_cycle_snapshots_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_cycle_snapshots
    ADD CONSTRAINT plan_cycle_snapshots_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: post_comments post_comments_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT post_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.social_posts(id) ON DELETE CASCADE;


--
-- Name: post_comments post_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT post_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: post_likes post_likes_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.social_posts(id) ON DELETE CASCADE;


--
-- Name: post_likes post_likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: social_posts social_posts_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_posts
    ADD CONSTRAINT social_posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: social_posts social_posts_workout_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_posts
    ADD CONSTRAINT social_posts_workout_session_id_fkey FOREIGN KEY (workout_session_id) REFERENCES public.workout_sessions(id) ON DELETE SET NULL;


--
-- Name: student_billing_plans student_billing_plans_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_billing_plans
    ADD CONSTRAINT student_billing_plans_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: student_billing_plans student_billing_plans_trainer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_billing_plans
    ADD CONSTRAINT student_billing_plans_trainer_id_fkey FOREIGN KEY (trainer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: student_charges student_charges_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_charges
    ADD CONSTRAINT student_charges_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.student_billing_plans(id) ON DELETE SET NULL;


--
-- Name: student_charges student_charges_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_charges
    ADD CONSTRAINT student_charges_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: student_charges student_charges_trainer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_charges
    ADD CONSTRAINT student_charges_trainer_id_fkey FOREIGN KEY (trainer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: trainer_clients trainer_clients_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trainer_clients
    ADD CONSTRAINT trainer_clients_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;


--
-- Name: trainer_clients trainer_clients_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trainer_clients
    ADD CONSTRAINT trainer_clients_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: trainer_clients trainer_clients_trainer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trainer_clients
    ADD CONSTRAINT trainer_clients_trainer_id_fkey FOREIGN KEY (trainer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: trainer_invite_codes trainer_invite_codes_redeemed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trainer_invite_codes
    ADD CONSTRAINT trainer_invite_codes_redeemed_by_fkey FOREIGN KEY (redeemed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: trainer_invite_codes trainer_invite_codes_trainer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trainer_invite_codes
    ADD CONSTRAINT trainer_invite_codes_trainer_id_fkey FOREIGN KEY (trainer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: trainer_profiles trainer_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trainer_profiles
    ADD CONSTRAINT trainer_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: trainer_subscriptions trainer_subscriptions_trainer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trainer_subscriptions
    ADD CONSTRAINT trainer_subscriptions_trainer_id_fkey FOREIGN KEY (trainer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_connections user_connections_addressee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_connections
    ADD CONSTRAINT user_connections_addressee_id_fkey FOREIGN KEY (addressee_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_connections user_connections_requester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_connections
    ADD CONSTRAINT user_connections_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_login_streaks user_login_streaks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_login_streaks
    ADD CONSTRAINT user_login_streaks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_anamnesis_updated_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_anamnesis_updated_by_id_fkey FOREIGN KEY (anamnesis_updated_by_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: users users_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;


--
-- Name: users users_protocol_updated_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_protocol_updated_by_id_fkey FOREIGN KEY (protocol_updated_by_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: workout_plans workout_plans_ai_generation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workout_plans
    ADD CONSTRAINT workout_plans_ai_generation_id_fkey FOREIGN KEY (ai_generation_id) REFERENCES public.ai_plan_generations(id) ON DELETE SET NULL;


--
-- Name: workout_plans workout_plans_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workout_plans
    ADD CONSTRAINT workout_plans_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: access_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_plan_generations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_plan_generations ENABLE ROW LEVEL SECURITY;

--
-- Name: billing_webhook_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.billing_webhook_events ENABLE ROW LEVEL SECURITY;

--
-- Name: companies; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

--
-- Name: deleted_accounts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.deleted_accounts ENABLE ROW LEVEL SECURITY;

--
-- Name: email_verification_codes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.email_verification_codes ENABLE ROW LEVEL SECURITY;

--
-- Name: exercise_set_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.exercise_set_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: exercises; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

--
-- Name: feedbacks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

--
--


--
-- Name: password_reset_codes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.password_reset_codes ENABLE ROW LEVEL SECURITY;

--
-- Name: physical_assessments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.physical_assessments ENABLE ROW LEVEL SECURITY;

--
-- Name: plan_cycle_snapshots; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.plan_cycle_snapshots ENABLE ROW LEVEL SECURITY;

--
-- Name: post_comments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

--
-- Name: post_likes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

--
-- Name: rate_limit_counters; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rate_limit_counters ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: shedlock; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.shedlock ENABLE ROW LEVEL SECURITY;

--
-- Name: social_posts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

--
-- Name: student_billing_plans; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.student_billing_plans ENABLE ROW LEVEL SECURITY;

--
-- Name: student_charges; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.student_charges ENABLE ROW LEVEL SECURITY;

--
-- Name: trainer_clients; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.trainer_clients ENABLE ROW LEVEL SECURITY;

--
-- Name: trainer_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.trainer_events ENABLE ROW LEVEL SECURITY;

--
-- Name: trainer_invite_codes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.trainer_invite_codes ENABLE ROW LEVEL SECURITY;

--
-- Name: trainer_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.trainer_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: trainer_subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.trainer_subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: user_connections; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;

--
-- Name: user_login_streaks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_login_streaks ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- Name: weight_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.weight_history ENABLE ROW LEVEL SECURITY;

--
-- Name: workout_execution_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.workout_execution_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: workout_plans; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;

--
-- Name: workout_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


