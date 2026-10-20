import { useEffect, useMemo, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { ArrowLeft, BadgeCheck, Clock, MessageCircle, Plus, ShieldCheck, X } from 'lucide-react';
import Avatar from '../components/Avatar';
import { formInputClass, formLabelClass } from '../components/personal/FormDialog';
import { riseItem, staggerContainer } from '../components/motion/primitives';
import { getMyTrainerProfile, saveMyTrainerProfile } from '../services/trainerProfileService';
import { qk, queryClient } from '../services/queryClient';
import type { TrainerEducation, TrainerProfile, TrainerProfileInput } from '../types';

const BIO_MAX = 1500;
const SPECIALTIES_MAX = 12;
const EDUCATION_MAX = 10;

/** Atalhos para as especialidades mais comuns (o personal pode digitar outras). */
const SUGGESTED_SPECIALTIES = [
  'Hipertrofia',
  'Emagrecimento',
  'Mobilidade',
  'Reabilitação',
  'Funcional',
  'Condicionamento',
  'Corrida',
  'Terceira idade',
  'Gestantes',
];

/** Mesma regra do backend (TrainerProfileService): 000000-G/UF, com ou sem hífen/barra. */
const CREF_RE = /^(CREF)?\d{6}-?[GP]\/?[A-Z]{2}$/;
const crefLooksValid = (value: string) => CREF_RE.test(value.toUpperCase().replace(/\s+/g, ''));

const errorText = (err: unknown, fallback: string) => {
  const data = (err as { response?: { data?: unknown } }).response?.data;
  return typeof data === 'string' && data ? data : fallback;
};

interface Draft {
  cref: string;
  bio: string;
  specialties: string[];
  education: { title: string; detail: string }[];
  modality: string;
  schedule: string;
  location: string;
}

const toDraft = (p: TrainerProfile): Draft => ({
  cref: p.cref ?? '',
  bio: p.bio ?? '',
  specialties: [...p.specialties],
  education: p.education.map((e) => ({ title: e.title, detail: e.detail ?? '' })),
  modality: p.modality ?? '',
  schedule: p.schedule ?? '',
  location: p.location ?? '',
});

const orNull = (v: string) => (v.trim() ? v.trim() : null);

const toInput = (d: Draft): TrainerProfileInput => ({
  cref: orNull(d.cref),
  bio: orNull(d.bio),
  specialties: d.specialties,
  education: d.education
    .filter((e) => e.title.trim())
    .map((e): TrainerEducation => ({ title: e.title.trim(), detail: orNull(e.detail) })),
  modality: orNull(d.modality),
  schedule: orNull(d.schedule),
  location: orNull(d.location),
});

const textareaClass = `${formInputClass} h-auto min-h-[150px] resize-y py-3 leading-relaxed`;

export default function MyProfilePage() {
  const profileQ = useQuery({ queryKey: qk.profile, queryFn: getMyTrainerProfile });
  const profile = profileQ.data ?? null;
  const loadError = profileQ.isError && !profile;
  // O rascunho nasce do perfil e não é sobrescrito por recargas em segundo plano.
  const [draft, setDraft] = useState<Draft | null>(() => (profile ? toDraft(profile) : null));
  const [saving, setSaving] = useState(false);
  const [specialtyInput, setSpecialtyInput] = useState('');

  useEffect(() => {
    if (profile && !draft) setDraft(toDraft(profile));
  }, [profile, draft]);

  const load = () => void profileQ.refetch();

  const dirty = useMemo(
    () => !!profile && !!draft && JSON.stringify(toInput(draft)) !== JSON.stringify(toInput(toDraft(profile))),
    [profile, draft],
  );

  const patch = (next: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...next } : d));

  const addSpecialty = (raw: string) => {
    if (!draft) return;
    const value = raw.trim();
    if (!value) return;
    if (draft.specialties.some((s) => s.toLowerCase() === value.toLowerCase())) {
      setSpecialtyInput('');
      return;
    }
    if (draft.specialties.length >= SPECIALTIES_MAX) {
      toast.error(`No máximo ${SPECIALTIES_MAX} especialidades.`);
      return;
    }
    patch({ specialties: [...draft.specialties, value.slice(0, 40)] });
    setSpecialtyInput('');
  };

  const onSpecialtyKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSpecialty(specialtyInput);
    }
  };

  const crefInvalid = !!draft?.cref.trim() && !crefLooksValid(draft.cref);

  const handleSave = async () => {
    if (!draft || crefInvalid) return;
    setSaving(true);
    try {
      const saved = await saveMyTrainerProfile(toInput(draft));
      queryClient.setQueryData<TrainerProfile>(qk.profile, saved);
      setDraft(toDraft(saved));
      toast.success('Perfil salvo', { description: 'Seus alunos já veem a versão nova no app.' });
    } catch (err) {
      toast.error(errorText(err, 'Não foi possível salvar o perfil.'));
    } finally {
      setSaving(false);
    }
  };

  // CREF salvo e verificado continua verificado só enquanto o número não muda.
  const crefState: 'none' | 'verified' | 'pending' = !draft?.cref.trim()
    ? 'none'
    : profile?.crefVerified && orNull(draft.cref) === profile.cref
      ? 'verified'
      : 'pending';

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-k-bg text-k-text">
      <header className="z-30 flex shrink-0 flex-wrap items-center gap-3.5 border-b border-k-ghost bg-k-bg/85 px-8 py-3.5 backdrop-blur-[14px]">
        <Link
          to="/students"
          aria-label="Voltar para alunos"
          className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-k-surface1 text-k-text-dim transition-colors hover:bg-k-surface2 hover:text-k-text"
        >
          <ArrowLeft className="h-[18px] w-[18px] transition-transform duration-300 group-hover:-translate-x-0.5" />
        </Link>
        <div>
          <h1 className="font-display text-xl font-extrabold tracking-tight font-stretch-semi-expanded">Meu perfil</h1>
          <p className="text-[12.5px] text-k-text-muted">O perfil profissional que seus alunos veem no app</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {dirty && <span className="hidden text-[12.5px] text-k-text-muted sm:inline">Alterações não salvas</span>}
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={!dirty || saving || crefInvalid}
            className="h-11 rounded-xl bg-k-primary px-5 text-sm font-bold text-k-on-primary transition-[box-shadow,opacity] hover:shadow-[0_0_0_4px_rgba(0,229,255,0.14)] disabled:pointer-events-none disabled:opacity-50"
          >
            {saving ? 'Salvando…' : 'Salvar perfil'}
          </button>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[1180px] px-8 pb-16 pt-10">
          {loadError ? (
            <div className="rounded-[18px] border border-dashed border-white/[0.14] p-10 text-center">
              <p className="text-k-text-dim">Não foi possível carregar o seu perfil.</p>
              <button
                type="button"
                onClick={load}
                className="mt-4 h-10 rounded-xl border border-white/10 bg-k-surface1 px-4 text-sm font-semibold hover:bg-k-surface2"
              >
                Tentar de novo
              </button>
            </div>
          ) : !profile || !draft ? (
            <div role="status" aria-label="Carregando perfil" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
              <div className="k-skeleton h-[520px] rounded-[18px] bg-k-surface1" />
              <div className="k-skeleton hidden h-[620px] rounded-[28px] bg-k-surface1 lg:block" />
            </div>
          ) : (
            <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
              <motion.form
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSave();
                }}
                className="flex flex-col gap-5"
              >
                <Section title="Registro profissional" hint="Os alunos veem o selo de verificado depois que o Kinetic confere o seu CREF.">
                  <label className="flex flex-col gap-2">
                    <span className={formLabelClass}>CREF</span>
                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        value={draft.cref}
                        onChange={(e) => patch({ cref: e.target.value })}
                        placeholder="012345-G/SP"
                        maxLength={24}
                        aria-invalid={crefInvalid}
                        className={`${formInputClass} max-w-[240px] font-mono uppercase ${crefInvalid ? 'border-k-alert/60' : ''}`}
                      />
                      <CrefBadge state={crefState} />
                    </div>
                    <span className={`text-[12.5px] ${crefInvalid ? 'text-k-alert' : 'text-k-text-muted'}`}>
                      {crefInvalid
                        ? 'Use o formato 000000-G/UF (G = graduado, P = provisionado).'
                        : 'Formato 000000-G/UF. Trocar o número remove a verificação.'}
                    </span>
                  </label>
                </Section>

                <Section title="Sobre" hint="Formação, anos de experiência, método de trabalho e o tipo de aluno que você acompanha.">
                  <textarea
                    value={draft.bio}
                    onChange={(e) => patch({ bio: e.target.value.slice(0, BIO_MAX) })}
                    placeholder="Ex.: Sou formado em Educação Física e acompanho alunos há 8 anos, com foco em hipertrofia e treino para iniciantes…"
                    aria-label="Sobre você"
                    className={textareaClass}
                  />
                  <span className="self-end font-mono text-[11.5px] text-k-text-muted">
                    {draft.bio.length}/{BIO_MAX}
                  </span>
                </Section>

                <Section title="Especialidades" hint={`Até ${SPECIALTIES_MAX}. Digite e aperte Enter, ou use um atalho.`}>
                  {draft.specialties.length > 0 && (
                    <ul className="flex flex-wrap gap-2">
                      {draft.specialties.map((s) => (
                        <li
                          key={s}
                          className="flex h-9 items-center gap-1.5 rounded-[10px] border border-k-primary/30 bg-k-primary-dim pl-3 pr-1.5 text-[13px] font-semibold text-k-primary"
                        >
                          {s}
                          <button
                            type="button"
                            aria-label={`Remover ${s}`}
                            onClick={() => patch({ specialties: draft.specialties.filter((x) => x !== s) })}
                            className="flex h-6 w-6 items-center justify-center rounded-md text-k-primary/80 hover:bg-k-primary/15 hover:text-k-primary"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="flex gap-2">
                    <input
                      value={specialtyInput}
                      onChange={(e) => setSpecialtyInput(e.target.value)}
                      onKeyDown={onSpecialtyKey}
                      placeholder="Nova especialidade"
                      maxLength={40}
                      aria-label="Nova especialidade"
                      disabled={draft.specialties.length >= SPECIALTIES_MAX}
                      className={`${formInputClass} max-w-[320px]`}
                    />
                    <button
                      type="button"
                      onClick={() => addSpecialty(specialtyInput)}
                      disabled={!specialtyInput.trim()}
                      className="flex h-12 items-center gap-1.5 rounded-xl border border-white/10 bg-k-surface1 px-4 text-sm font-semibold text-k-text-dim transition-colors hover:bg-k-surface2 hover:text-k-text disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED_SPECIALTIES.filter(
                      (s) => !draft.specialties.some((x) => x.toLowerCase() === s.toLowerCase()),
                    ).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => addSpecialty(s)}
                        className="h-8 rounded-[9px] border border-dashed border-white/[0.16] px-2.5 text-[12.5px] text-k-text-dim transition-colors hover:border-k-primary/45 hover:text-k-primary"
                      >
                        + {s}
                      </button>
                    ))}
                  </div>
                </Section>

                <Section title="Formação e certificações" hint="Graduação, pós, cursos e certificações. O detalhe costuma ser a instituição e o ano.">
                  {draft.education.length > 0 && (
                    <ul className="flex flex-col gap-2.5">
                      {draft.education.map((item, i) => (
                        <li key={i} className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_44px] gap-2.5">
                          <input
                            value={item.title}
                            onChange={(e) =>
                              patch({
                                education: draft.education.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)),
                              })
                            }
                            placeholder="Bacharelado em Educação Física"
                            maxLength={120}
                            aria-label={`Formação ${i + 1}`}
                            className={formInputClass}
                          />
                          <input
                            value={item.detail}
                            onChange={(e) =>
                              patch({
                                education: draft.education.map((x, j) => (j === i ? { ...x, detail: e.target.value } : x)),
                              })
                            }
                            placeholder="Instituição · ano"
                            maxLength={120}
                            aria-label={`Detalhe da formação ${i + 1}`}
                            className={formInputClass}
                          />
                          <button
                            type="button"
                            aria-label={`Remover formação ${i + 1}`}
                            onClick={() => patch({ education: draft.education.filter((_, j) => j !== i) })}
                            className="flex h-12 w-11 items-center justify-center rounded-xl border border-white/10 text-k-text-dim transition-colors hover:border-k-alert/40 hover:text-k-alert"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <button
                    type="button"
                    onClick={() => patch({ education: [...draft.education, { title: '', detail: '' }] })}
                    disabled={draft.education.length >= EDUCATION_MAX}
                    className="flex h-11 items-center gap-1.5 self-start rounded-xl border border-dashed border-white/[0.16] px-4 text-sm font-semibold text-k-text-dim transition-colors hover:border-k-primary/45 hover:text-k-primary disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar formação
                  </button>
                </Section>

                <Section title="Atendimento">
                  <div className="grid gap-3 md:grid-cols-3">
                    <label className="flex flex-col gap-2">
                      <span className={formLabelClass}>Modalidade</span>
                      <input
                        value={draft.modality}
                        onChange={(e) => patch({ modality: e.target.value })}
                        placeholder="Presencial e online"
                        maxLength={80}
                        className={formInputClass}
                      />
                    </label>
                    <label className="flex flex-col gap-2">
                      <span className={formLabelClass}>Horário</span>
                      <input
                        value={draft.schedule}
                        onChange={(e) => patch({ schedule: e.target.value })}
                        placeholder="Seg–sex · 7h–20h"
                        maxLength={80}
                        className={formInputClass}
                      />
                    </label>
                    <label className="flex flex-col gap-2">
                      <span className={formLabelClass}>Local</span>
                      <input
                        value={draft.location}
                        onChange={(e) => patch({ location: e.target.value })}
                        placeholder="Cidade, UF"
                        maxLength={80}
                        className={formInputClass}
                      />
                    </label>
                  </div>
                </Section>
              </motion.form>

              <aside aria-label="Prévia no app do aluno" className="lg:sticky lg:top-0">
                <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-k-text-muted">
                  Como o aluno vê no app
                </p>
                <StudentPreview profile={profile} input={toInput(draft)} crefState={crefState} />
              </aside>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <motion.section
      variants={riseItem}
      className="flex flex-col gap-4 rounded-[18px] border border-k-ghost bg-k-surface1 p-6"
    >
      <div>
        <h2 className="font-display text-[17px] font-extrabold tracking-tight font-stretch-semi-expanded">{title}</h2>
        {hint && <p className="mt-1 text-[13px] text-k-text-muted">{hint}</p>}
      </div>
      {children}
    </motion.section>
  );
}

function CrefBadge({ state }: { state: 'none' | 'verified' | 'pending' }) {
  if (state === 'none') return null;
  return state === 'verified' ? (
    <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-k-success/10 px-3 text-[12.5px] font-semibold text-k-success">
      <BadgeCheck className="h-3.5 w-3.5" />
      Verificado
    </span>
  ) : (
    <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-white/5 px-3 text-[12.5px] font-semibold text-k-text-dim">
      <Clock className="h-3.5 w-3.5" />
      Aguardando verificação
    </span>
  );
}

/**
 * Prévia da tela "Seu personal" do app (artboard Personal): as seções só aparecem
 * quando preenchidas, igual no app. Os números do vínculo variam por aluno.
 */
function StudentPreview({
  profile,
  input,
  crefState,
}: {
  profile: TrainerProfile;
  input: TrainerProfileInput;
  crefState: 'none' | 'verified' | 'pending';
}) {
  const hasService = input.modality || input.schedule || input.location;
  const empty = !input.bio && input.specialties.length === 0 && input.education.length === 0 && !hasService;

  return (
    <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#131313] shadow-[0_40px_90px_-30px_rgba(0,0,0,0.8)]">
      <div className="py-3 text-center text-[13px] font-semibold">Seu personal</div>
      <div className="flex flex-col gap-5 px-5 pb-5">
        <div className="flex items-start gap-3.5">
          <Avatar name={profile.nome} avatarUrl={profile.avatarUrl} size={64} />
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-[17px] font-semibold leading-tight tracking-[-0.2px]">{profile.nome}</p>
            <p className="text-[12.5px] text-k-text-dim">Personal trainer</p>
            {input.cref && (
              <p
                className={`flex items-center gap-1.5 text-[12px] font-medium ${
                  crefState === 'verified' ? 'text-k-success' : 'text-k-text-muted'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                CREF {input.cref.toUpperCase()}
                {crefState === 'verified' ? ' verificado' : ''}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 border-y border-white/[0.07] py-2.5">
          {['Seu personal desde', 'Fichas ativas', 'Última revisão'].map((label) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span className="font-mono text-[14px] font-semibold text-k-text-muted">—</span>
              <span className="text-[11px] leading-tight text-k-text-muted">{label}</span>
            </div>
          ))}
        </div>

        {empty && (
          <p className="rounded-xl border border-dashed border-white/[0.14] p-4 text-center text-[12.5px] text-k-text-muted">
            Preencha o perfil ao lado. Seções vazias não aparecem para o aluno.
          </p>
        )}

        {input.bio && (
          <PreviewBlock title="Sobre">
            <p className="whitespace-pre-line text-[13px] leading-[20px] text-k-text-soft/80">{input.bio}</p>
          </PreviewBlock>
        )}

        {input.specialties.length > 0 && (
          <PreviewBlock title="Especialidades">
            <div className="flex flex-wrap gap-1.5">
              {input.specialties.map((s) => (
                <span key={s} className="rounded-lg border border-white/[0.12] px-2.5 py-1.5 text-[12px]">
                  {s}
                </span>
              ))}
            </div>
          </PreviewBlock>
        )}

        {input.education.length > 0 && (
          <PreviewBlock title="Formação e certificações">
            <ul>
              {input.education.map((e, i) => (
                <li key={i} className="flex flex-col gap-0.5 border-b border-white/[0.06] py-2 last:border-b-0">
                  <span className="text-[13px]">{e.title}</span>
                  {e.detail && <span className="text-[11.5px] text-k-text-muted">{e.detail}</span>}
                </li>
              ))}
            </ul>
          </PreviewBlock>
        )}

        {hasService && (
          <PreviewBlock title="Atendimento">
            <dl>
              {(
                [
                  ['Modalidade', input.modality],
                  ['Horário', input.schedule],
                  ['Local', input.location],
                ] as const
              )
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3 border-b border-white/[0.06] py-2 last:border-b-0">
                    <dt className="text-[13px] text-k-text-dim">{k}</dt>
                    <dd className="text-right text-[13px]">{v}</dd>
                  </div>
                ))}
            </dl>
          </PreviewBlock>
        )}
      </div>
      <div className="border-t border-white/[0.07] p-4">
        <div className="flex h-11 items-center justify-center gap-2 rounded-xl bg-k-success text-[14px] font-semibold text-[#062012]">
          <MessageCircle className="h-4 w-4" />
          Conversar no WhatsApp
        </div>
      </div>
    </div>
  );
}

function PreviewBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-[14px] font-semibold">{title}</h3>
      {children}
    </section>
  );
}
