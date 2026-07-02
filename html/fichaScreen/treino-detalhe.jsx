// treino-detalhe.jsx — Kinetic · Detalhe da Ficha (PULL DAY) — versão corrigida

// ─── Tokens (mesmo sistema do treinar.jsx) ─────────────────────
const HKT = {
  bg: '#131313', s1: '#1c1b1b', s2: '#2a2a2a', s3: '#353534',
  primary: '#00E5FF',
  primaryDim: 'rgba(0,229,255,0.10)', primarySoft: 'rgba(0,229,255,0.20)',
  primaryGrad: 'linear-gradient(135deg, #00E5FF 0%, #00bcd4 100%)',
  text: '#f5f6f7', text2: 'rgba(245,246,247,0.62)', text3: 'rgba(245,246,247,0.36)',
  ghost: 'rgba(255,255,255,0.08)', ghostHi: 'rgba(255,255,255,0.15)',
  font: 'Inter, -apple-system, system-ui, sans-serif',
};

// Acento único do dia — usado com moderação (badge, CTA, aba ativa, valores-chave).
// Tags de músculo/tipo agora são neutras: elimina o "arco-íris" de cores por músculo.
const DAY_ACCENT = {
  color: '#00E5FF', dim: 'rgba(0,229,255,0.10)', soft: 'rgba(0,229,255,0.22)',
  grad: 'linear-gradient(135deg,#00E5FF,#00bcd4)', fg: '#001f24',
};

// ─── Dados mock ─────────────────────────────────────────────────
const FICHA = {
  dia: 'A',
  nome: 'Pull Day',
  grupos: ['Costas', 'Bíceps', 'Antebraço', 'Posterior'],
};

const SECOES = [
  {
    id: 'aquecimento', label: 'Aquecimento',
    exercicios: [
      { nome: 'Dislocação de Ombro com Bastão', qualificador: 'Aquecimento dinâmico', musculo: 'Ombro', tipo: 'Mobilidade', series: '3 x 12', unidade: 'repetições', peso: 'Sem carga', rpe: 3, descanso: '45s' },
    ],
  },
  {
    id: 'principal', label: 'Treino principal',
    exercicios: [
      { nome: 'Barra Fixa Pronada',   qualificador: null, musculo: 'Costas',     tipo: 'Hipertrofia', series: '4 x 8',  unidade: 'repetições', peso: 'Peso corporal', rpe: 8, descanso: '90s' },
      { nome: 'Remada Curvada',       qualificador: null, musculo: 'Costas',     tipo: 'Hipertrofia', series: '4 x 10', unidade: 'repetições', peso: '40 kg', rpe: 8, descanso: '90s', volumeKg: 4 * 10 * 40 },
      { nome: 'Puxada Alta Pronada',  qualificador: null, musculo: 'Costas',     tipo: 'Hipertrofia', series: '3 x 12', unidade: 'repetições', peso: '45 kg', rpe: 7, descanso: '75s', volumeKg: 3 * 12 * 45 },
      { nome: 'Rosca Direta',         qualificador: null, musculo: 'Bíceps',     tipo: 'Hipertrofia', series: '3 x 12', unidade: 'repetições', peso: '14 kg', rpe: 8, descanso: '60s', volumeKg: 3 * 12 * 14 },
      { nome: 'Rosca Punho',          qualificador: null, musculo: 'Antebraço',  tipo: 'Hipertrofia', series: '3 x 12', unidade: 'repetições', peso: '10 kg', rpe: 8, descanso: '90s', volumeKg: 3 * 12 * 10 },
    ],
  },
  {
    id: 'finalizacao', label: 'Finalização',
    exercicios: [
      { nome: 'Corrida Contínua na Esteira', qualificador: 'Recuperação ativa', musculo: 'Posterior', tipo: 'Cardio', series: '1 x 20', unidade: 'minutos', peso: 'Zona 2 de FC', rpe: null, descanso: '120s' },
    ],
  },
];

const TOTAL_EXERCICIOS = SECOES.reduce((n, s) => n + s.exercicios.length, 0);
const TOTAL_VOLUME_KG = SECOES.reduce((sum, s) => sum + s.exercicios.reduce((n, e) => n + (e.volumeKg || 0), 0), 0);

// ─── Ícones ─────────────────────────────────────────────────────
function IcChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 6l-7 6 7 6" />
    </svg>
  );
}
function IcArrow() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
function IcSparkle() {
  return <span style={{ fontSize: 12 }}>✦</span>;
}
function IcInfo() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 16v-5M12 8h.01" />
    </svg>
  );
}
const TTAB_ICONS = {
  home:    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  train:   <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4v16M18 4v16M3 8h3M18 8h3M3 16h3M18 16h3M6 12h12"/></svg>,
  stats:   <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 20h18M6 20V10M11 20V4M16 20v-7"/></svg>,
  social:  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  profile: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
};

// ─── Tab bar (fixa) ─────────────────────────────────────────────
const TABBAR_HEIGHT = 96;
function TabBar({ active, onChange }) {
  const tabs = [
    { id: 'home',    label: 'Home'    },
    { id: 'train',   label: 'Treinar' },
    { id: 'stats',   label: 'Stats'   },
    { id: 'social',  label: 'Social'  },
    { id: 'profile', label: 'Perfil'  },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 70,
      paddingBottom: 26,
      background: 'linear-gradient(180deg, rgba(19,19,19,0) 0%, rgba(19,19,19,0.96) 28%, #131313 100%)',
      backdropFilter: 'blur(10px)',
    }}>
      <div style={{ display: 'flex', padding: '8px 10px 0' }}>
        {tabs.map(t => {
          const a = active === t.id;
          return (
            <button key={t.id} onClick={() => onChange(t.id)} style={{
              all: 'unset', cursor: 'pointer', flex: 1,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: '6px 0',
            }}>
              <div style={{
                padding: '5px 14px', borderRadius: 10,
                background: a ? HKT.primaryDim : 'transparent',
                border: a ? `1px solid ${HKT.primarySoft}` : '1px solid transparent',
                color: a ? HKT.primary : HKT.text3,
                transition: 'all 160ms ease',
              }}>{TTAB_ICONS[t.id]}</div>
              <span style={{
                fontFamily: HKT.font, fontSize: 10, fontWeight: a ? 700 : 500,
                color: a ? HKT.primary : HKT.text3, letterSpacing: 0.3,
              }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Header de detalhe: só back + título curto (sem logo/sino redundantes) ──
function DetalheHeader({ onBack }) {
  return (
    <div style={{
      padding: '52px 16px 10px',
      background: HKT.bg, position: 'sticky', top: 0, zIndex: 20,
    }}>
      <button onClick={onBack} style={{
        all: 'unset', cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 6,
        color: HKT.text2, fontFamily: HKT.font, fontSize: 13, fontWeight: 600,
      }}>
        <span style={{
          width: 28, height: 28, borderRadius: 9, background: HKT.s1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: HKT.text,
        }}><IcChevronLeft /></span>
        Fichas
      </button>
    </div>
  );
}

// ─── Bloco de título + meta ─────────────────────────────────────
function TitleBlock({ tagsColoridas }) {
  return (
    <div style={{ padding: '4px 20px 18px' }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center',
        padding: '3px 10px', borderRadius: 999, marginBottom: 12,
        background: DAY_ACCENT.dim, border: `1px solid ${DAY_ACCENT.soft}`,
        fontFamily: HKT.font, fontSize: 10, fontWeight: 700,
        color: DAY_ACCENT.color, letterSpacing: 1,
      }}>DIA {FICHA.dia}</div>

      <div style={{
        fontFamily: HKT.font, fontSize: 32, fontWeight: 900, fontStyle: 'italic',
        color: HKT.text, letterSpacing: -1, lineHeight: 1.05, marginBottom: 12,
      }}>{FICHA.nome.toUpperCase()}</div>

      {/* Chips de grupo muscular — separados do texto de disclaimer, ortografia correta */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {FICHA.grupos.map(g => (
          <span key={g} style={{
            padding: '4px 10px', borderRadius: 999, background: HKT.ghost,
            fontFamily: HKT.font, fontSize: 11, fontWeight: 600, color: HKT.text2,
          }}>{g}</span>
        ))}
      </div>

      {/* Disclaimer de IA + legenda de RPE — bloco próprio, não misturado ao título */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 5,
        padding: '10px 12px', borderRadius: 12, background: HKT.ghost, marginBottom: 12,
      }}>
        <span style={{ display: 'flex', gap: 7, alignItems: 'flex-start', fontFamily: HKT.font, fontSize: 11.5, color: HKT.text3, lineHeight: 1.45 }}>
          <IcSparkle /> Sugestão por IA — consulte um profissional de educação física.
        </span>
        <span style={{ display: 'flex', gap: 7, alignItems: 'flex-start', fontFamily: HKT.font, fontSize: 11.5, color: HKT.text3, lineHeight: 1.45 }}>
          <span style={{ flexShrink: 0, marginTop: 1 }}><IcInfo /></span>
          RPE = esforço percebido, de 1 (muito leve) a 10 (esforço máximo).
        </span>
      </div>

      {/* Meta com número real, sem "calculado" vago */}
      <div style={{ fontFamily: HKT.font, fontSize: 12.5, color: HKT.text2, fontWeight: 500 }}>
        {TOTAL_EXERCICIOS} exercícios · <span style={{ color: DAY_ACCENT.color, fontWeight: 700 }}>≈ {TOTAL_VOLUME_KG.toLocaleString('pt-BR')} kg</span> de volume total
      </div>
    </div>
  );
}

function SectionHeader({ label }) {
  return (
    <div style={{
      padding: '4px 20px 8px', marginTop: 6,
      fontFamily: HKT.font, fontSize: 11, fontWeight: 700,
      color: HKT.text3, letterSpacing: 1.4, textTransform: 'uppercase',
    }}>{label}</div>
  );
}

// ─── Card de exercício ──────────────────────────────────────────
function ExerciseCard({ ex, tagsColoridas }) {
  const musculoStyle = tagsColoridas
    ? { background: DAY_ACCENT.dim, border: `1px solid ${DAY_ACCENT.soft}`, color: DAY_ACCENT.color }
    : { background: HKT.ghost, border: '1px solid transparent', color: HKT.text2 };

  return (
    <div style={{ display: 'flex', background: HKT.s1, borderRadius: 18, overflow: 'hidden' }}>
      <div style={{ width: 3, background: DAY_ACCENT.grad, flexShrink: 0 }} />
      <div style={{ padding: '14px 16px 15px', flex: 1, minWidth: 0 }}>

        <div style={{
          fontFamily: HKT.font, fontSize: 16.5, fontWeight: 700,
          color: HKT.text, lineHeight: 1.25,
        }}>{ex.nome}</div>
        {ex.qualificador && (
          <div style={{
            fontFamily: HKT.font, fontSize: 11.5, fontStyle: 'italic',
            color: HKT.text3, marginTop: 2, marginBottom: 10,
          }}>{ex.qualificador}</div>
        )}
        {!ex.qualificador && <div style={{ height: 10 }} />}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
          <span style={{
            padding: '3px 9px', borderRadius: 999,
            fontFamily: HKT.font, fontSize: 10, fontWeight: 700, letterSpacing: 0.3,
            ...musculoStyle,
          }}>{ex.musculo}</span>
          <span style={{
            padding: '3px 9px', borderRadius: 999, background: 'transparent',
            border: `1px solid ${HKT.ghostHi}`,
            fontFamily: HKT.font, fontSize: 10, fontWeight: 600, color: HKT.text3,
          }}>{ex.tipo}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, alignItems: 'start' }}>
          <div>
            <div style={{ fontFamily: HKT.font, fontSize: 9.5, fontWeight: 700, color: HKT.text3, letterSpacing: 0.6, marginBottom: 4 }}>SÉRIES × REPS</div>
            <div style={{ fontFamily: HKT.font, fontSize: 13.5, fontWeight: 700, color: HKT.text, lineHeight: 1.3 }}>{ex.series}<br />{ex.unidade}</div>
          </div>
          <div>
            <div style={{ fontFamily: HKT.font, fontSize: 9.5, fontWeight: 700, color: HKT.text3, letterSpacing: 0.6, marginBottom: 4 }}>SUGESTÃO</div>
            <div style={{ fontFamily: HKT.font, fontSize: 13.5, fontWeight: 700, color: DAY_ACCENT.color, lineHeight: 1.3 }}>
              {ex.peso}{ex.rpe != null ? ` · RPE ${ex.rpe}` : ''}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: HKT.font, fontSize: 9.5, fontWeight: 700, color: HKT.text3, letterSpacing: 0.6, marginBottom: 4 }}>DESCANSO</div>
            <div style={{ fontFamily: HKT.font, fontSize: 13.5, fontWeight: 700, color: HKT.text, lineHeight: 1.3 }}>{ex.descanso}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Botão Iniciar treino ───────────────────────────────────────
function CTAButton() {
  return (
    <button style={{
      all: 'unset', cursor: 'pointer',
      width: '100%', boxSizing: 'border-box',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      padding: '15px 0', borderRadius: 14,
      background: DAY_ACCENT.grad,
      color: DAY_ACCENT.fg, fontFamily: HKT.font, fontWeight: 800, fontSize: 15,
      letterSpacing: 0.2,
      boxShadow: `0 6px 18px rgba(0,0,0,0.35)`,
    }}>
      Iniciar treino <IcArrow />
    </button>
  );
}

// ─── Tela principal ─────────────────────────────────────────────
function TreinoDetalheScreen({ tweaks }) {
  const [tab, setTab] = React.useState('train');
  const agrupado = (tweaks.agrupar || 'sim') === 'sim';
  const ctaFixo = (tweaks.cta || 'fixo') === 'fixo';
  const tagsColoridas = (tweaks.tags || 'neutras') === 'coloridas';

  const secoesRender = agrupado
    ? SECOES
    : [{ id: 'todos', label: null, exercicios: SECOES.flatMap(s => s.exercicios) }];

  return (
    <div data-screen-label="Treino — Detalhe" style={{
      background: HKT.bg, color: HKT.text, fontFamily: HKT.font,
      height: '100%', display: 'flex', flexDirection: 'column',
      position: 'relative',
    }}>
      <DetalheHeader onBack={() => {}} />

      <div style={{
        flex: 1, overflowY: 'auto', className: 'kinetic-scroll',
        paddingBottom: ctaFixo ? TABBAR_HEIGHT + 96 : TABBAR_HEIGHT + 24,
      }} className="kinetic-scroll">

        <TitleBlock tagsColoridas={tagsColoridas} />

        {secoesRender.map(sec => (
          <div key={sec.id}>
            {sec.label && <SectionHeader label={sec.label} />}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 16px' }}>
              {sec.exercicios.map(ex => (
                <ExerciseCard key={ex.nome} ex={ex} tagsColoridas={tagsColoridas} />
              ))}
            </div>
          </div>
        ))}

        {!ctaFixo && (
          <div style={{ padding: '18px 16px 0' }}>
            <CTAButton />
          </div>
        )}
      </div>

      {ctaFixo && (
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: TABBAR_HEIGHT, zIndex: 60,
          padding: '18px 16px 16px',
          background: `linear-gradient(to bottom, transparent, ${HKT.bg} 55%, ${HKT.bg})`,
        }}>
          <CTAButton />
        </div>
      )}

      <TabBar active={tab} onChange={setTab} />
    </div>
  );
}

window.TreinoDetalheScreen = TreinoDetalheScreen;
