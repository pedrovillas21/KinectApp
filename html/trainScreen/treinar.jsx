// treinar.jsx — Kinetic · Fichas de Treino (nova tela)

// ─── Tokens ───────────────────────────────────────────────────
const HKT = {
  bg: '#131313', s1: '#1c1b1b', s2: '#2a2a2a', s3: '#353534',
  primary: '#00E5FF',
  primaryDim: 'rgba(0,229,255,0.10)', primarySoft: 'rgba(0,229,255,0.20)',
  primaryGrad: 'linear-gradient(135deg, #00E5FF 0%, #00daf3 100%)',
  text: '#f5f6f7', text2: 'rgba(245,246,247,0.62)', text3: 'rgba(245,246,247,0.36)',
  ghost: 'rgba(255,255,255,0.08)', ghostHi: 'rgba(255,255,255,0.15)',
  font: 'Inter, -apple-system, system-ui, sans-serif',
};

// ─── Accent palette por dia ────────────────────────────────────
const ACCENTS = {
  A: { color: '#00E5FF', dim: 'rgba(0,229,255,0.10)',    soft: 'rgba(0,229,255,0.22)',    grad: 'linear-gradient(135deg,#00E5FF,#00bcd4)', fg: '#001f24' },
  B: { color: '#f5b945', dim: 'rgba(245,185,69,0.10)',   soft: 'rgba(245,185,69,0.22)',   grad: 'linear-gradient(135deg,#f5b945,#e09820)', fg: '#241700' },
  C: { color: '#4ade80', dim: 'rgba(74,222,128,0.10)',   soft: 'rgba(74,222,128,0.22)',   grad: 'linear-gradient(135deg,#4ade80,#22c55e)', fg: '#001f0c' },
};

// ─── Mock fichas ───────────────────────────────────────────────
const FICHAS_DATA = [
  { dia: 'A', nome: 'Pull Day',  grupos: ['Costas','Bíceps','Antebraço','Posterior'], ex: 7, min: 50, lastHa: '3 dias' },
  { dia: 'B', nome: 'Push Day',  grupos: ['Peito','Tríceps','Ombro Anterior'],        ex: 8, min: 55, lastHa: '5 dias' },
  { dia: 'C', nome: 'Leg Day',   grupos: ['Quadríceps','Posterior','Glúteo'],         ex: 6, min: 45, lastHa: null     },
];

// ─── Ícones ────────────────────────────────────────────────────
function IcDumbbell() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4v16M18 4v16M3 8h3M18 8h3M3 16h3M18 16h3M6 12h12"/>
    </svg>
  );
}
function IcClock() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}
function IcHistory() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10"/>
      <path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
    </svg>
  );
}
function IcArrow() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  );
}
function IcBell() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 01-3.46 0"/>
    </svg>
  );
}

// ─── Tab bar ───────────────────────────────────────────────────
const TTAB_ICONS = {
  home:    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  train:   <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4v16M18 4v16M3 8h3M18 8h3M3 16h3M18 16h3M6 12h12"/></svg>,
  stats:   <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 20h18M6 20V10M11 20V4M16 20v-7"/></svg>,
  social:  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  profile: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
};

function TreinarTabBar({ active, onChange }) {
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

// ─── Metric item ───────────────────────────────────────────────
function MetricItem({ icon, label, muted }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontFamily: HKT.font, fontSize: 11, fontWeight: 500,
      color: muted ? HKT.text3 : HKT.text2,
    }}>
      {icon}
      {label}
    </span>
  );
}

// ─── Chips de músculos ─────────────────────────────────────────
function MuscleChips({ grupos }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
      {grupos.map(g => (
        <span key={g} style={{
          padding: '3px 9px', borderRadius: 999,
          background: HKT.ghost,
          fontFamily: HKT.font, fontSize: 10, fontWeight: 600, color: HKT.text2,
        }}>{g}</span>
      ))}
    </div>
  );
}

// ─── Linha de métricas + botão Iniciar ────────────────────────
function FichaBottom({ ficha, accent }) {
  return (
    <>
      {/* Métricas na própria linha */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
        <MetricItem icon={<IcDumbbell/>} label={`${ficha.ex} exercícios`}/>
        <span style={{ color: HKT.text3, fontSize: 10 }}>·</span>
        <MetricItem icon={<IcClock/>} label={`${ficha.min} min`}/>
        <span style={{ color: HKT.text3, fontSize: 10 }}>·</span>
        <MetricItem icon={<IcHistory/>} label={ficha.lastHa ? `Há ${ficha.lastHa}` : 'Nunca'} muted={!ficha.lastHa}/>
      </div>
      {/* Botão largura total */}
      <button style={{
        all: 'unset', cursor: 'pointer',
        width: '100%', boxSizing: 'border-box',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: '13px 0', borderRadius: 13,
        background: accent.grad,
        color: accent.fg, fontFamily: HKT.font, fontWeight: 800, fontSize: 14,
        letterSpacing: 0.2,
        boxShadow: `0 4px 20px ${accent.soft}`,
        transition: 'opacity 120ms ease',
      }}>
        Iniciar treino <IcArrow/>
      </button>
    </>
  );
}

// ─── Card Compacto ─────────────────────────────────────────────
function FichaCompacta({ ficha, accent, showIA }) {
  return (
    <div style={{ background: HKT.s1, borderRadius: 20, overflow: 'hidden' }}>
      <div style={{ height: 3, background: accent.grad }}/>
      <div style={{ padding: '14px 16px 16px' }}>

        {/* Topo: badge DIA + badge IA */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '3px 10px', borderRadius: 999,
            background: accent.dim, border: `1px solid ${accent.soft}`,
            fontFamily: HKT.font, fontSize: 10, fontWeight: 700,
            color: accent.color, letterSpacing: 1,
          }}>DIA {ficha.dia}</div>

          {showIA && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '3px 9px', borderRadius: 999,
              background: HKT.ghost,
              fontFamily: HKT.font, fontSize: 10, fontWeight: 600, color: HKT.text3,
            }}>✦ Sugestão IA</div>
          )}
        </div>

        {/* Nome */}
        <div style={{
          fontFamily: HKT.font, fontSize: 22, fontWeight: 800,
          letterSpacing: -0.6, color: HKT.text, lineHeight: 1.1, marginBottom: 10,
        }}>{ficha.nome}</div>

        <MuscleChips grupos={ficha.grupos}/>
        <FichaBottom ficha={ficha} accent={accent}/>
      </div>
    </div>
  );
}

// ─── Card Com Imagem ───────────────────────────────────────────
function FichaComImagem({ ficha, accent, showIA }) {
  const stripe = `repeating-linear-gradient(-45deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 8px, transparent 8px, transparent 18px)`;
  return (
    <div style={{ background: HKT.s1, borderRadius: 20, overflow: 'hidden' }}>

      {/* Área de imagem */}
      <div style={{ height: 128, position: 'relative', background: `${stripe}, ${HKT.s2}` }}>
        {/* tint de cor */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(135deg, ${accent.dim} 0%, transparent 65%)`,
        }}/>
        {/* gradiente base→conteúdo */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 90,
          background: `linear-gradient(to bottom, transparent, ${HKT.s1})`,
        }}/>
        {/* label placeholder */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontFamily: 'monospace', fontSize: 10, color: HKT.text3, opacity: 0.45 }}>
            foto do treino
          </span>
        </div>
        {/* Badge DIA flutuando */}
        <div style={{
          position: 'absolute', top: 12, left: 14,
          display: 'inline-flex', alignItems: 'center',
          padding: '4px 10px', borderRadius: 999,
          background: 'rgba(19,19,19,0.65)', backdropFilter: 'blur(8px)',
          border: `1px solid ${accent.soft}`,
          fontFamily: HKT.font, fontSize: 10, fontWeight: 700,
          color: accent.color, letterSpacing: 1,
        }}>DIA {ficha.dia}</div>
        {/* Badge IA flutuando */}
        {showIA && (
          <div style={{
            position: 'absolute', top: 12, right: 14,
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '4px 9px', borderRadius: 999,
            background: 'rgba(19,19,19,0.65)', backdropFilter: 'blur(8px)',
            border: `1px solid ${HKT.ghost}`,
            fontFamily: HKT.font, fontSize: 10, fontWeight: 600, color: HKT.text3,
          }}>✦ Sugestão IA</div>
        )}
      </div>

      <div style={{ padding: '4px 16px 16px' }}>
        <div style={{
          fontFamily: HKT.font, fontSize: 22, fontWeight: 800,
          letterSpacing: -0.6, color: HKT.text, lineHeight: 1.1, marginBottom: 10,
        }}>{ficha.nome}</div>
        <MuscleChips grupos={ficha.grupos}/>
        <FichaBottom ficha={ficha} accent={accent}/>
      </div>
    </div>
  );
}

// ─── Disclaimer rodapé ─────────────────────────────────────────
function IADisclaimer() {
  return (
    <div style={{
      margin: '16px 16px 0',
      display: 'flex', alignItems: 'flex-start', gap: 8,
      padding: '10px 14px', borderRadius: 14,
      background: HKT.ghost,
    }}>
      <span style={{ color: HKT.text3, fontSize: 13, flexShrink: 0 }}>✦</span>
      <span style={{
        fontFamily: HKT.font, fontSize: 11, color: HKT.text3, lineHeight: 1.55,
      }}>
        Fichas geradas por IA com base no seu perfil. Consulte um profissional de educação física antes de iniciar qualquer programa de treinos.
      </span>
    </div>
  );
}

// ─── Tela principal ────────────────────────────────────────────
function TreinarScreen({ tweaks }) {
  const [tab, setTab] = React.useState('train');
  const layout  = tweaks.layout  || 'compacto';
  const cores   = tweaks.cores   || 'colorido';
  const showIA  = (tweaks.ia     || 'visível') === 'visível';

  function getAccent(dia) {
    return cores === 'colorido' ? (ACCENTS[dia] || ACCENTS.A) : ACCENTS.A;
  }

  return (
    <div style={{
      background: HKT.bg, color: HKT.text, fontFamily: HKT.font,
      height: '100%', display: 'flex', flexDirection: 'column',
      position: 'relative',
    }}>

      {/* Top bar */}
      <div style={{
        padding: '52px 20px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: HKT.bg, position: 'sticky', top: 0, zIndex: 10,
      }}>
        <span style={{
          fontFamily: HKT.font, fontWeight: 900, fontSize: 22,
          color: HKT.text, letterSpacing: -0.5,
        }}>KINETIC</span>
        <button style={{
          all: 'unset', cursor: 'pointer',
          width: 36, height: 36, borderRadius: 11,
          background: HKT.s1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: HKT.text2,
        }}>
          <IcBell/>
        </button>
      </div>

      {/* Scroll area */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 100 }} className="kinetic-scroll">

        {/* Título da seção */}
        <div style={{ padding: '0px 20px 20px' }}>
          <div style={{
            fontFamily: HKT.font, fontSize: 30, fontWeight: 900, fontStyle: 'italic',
            color: HKT.text, letterSpacing: -1, lineHeight: 1.05,
          }}>SUAS FICHAS</div>
          <div style={{
            fontFamily: HKT.font, fontSize: 13, color: HKT.text2,
            marginTop: 6, fontWeight: 400, lineHeight: 1.4,
          }}>Escolha um treino da sua grade personalizada.</div>
        </div>

        {/* Lista de fichas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 16px' }}>
          {FICHAS_DATA.map(ficha => {
            const accent = getAccent(ficha.dia);
            const props  = { key: ficha.dia, ficha, accent, showIA };
            return layout === 'imagem'
              ? <FichaComImagem {...props}/>
              : <FichaCompacta  {...props}/>;
          })}
        </div>

        {/* Disclaimer IA */}
        {showIA && <IADisclaimer/>}

        <div style={{ height: 24 }}/>
      </div>

      <TreinarTabBar active={tab} onChange={setTab}/>
    </div>
  );
}

window.TreinarScreen = TreinarScreen;
