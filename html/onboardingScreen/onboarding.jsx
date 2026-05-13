// Kinetic — Onboarding (revised, multi-step)
// Implements all P0/P1/P2 fixes from the parecer:
// P0: replace placeholder-numbers with scroll-snap wheel pickers; split into steps;
//     compact experience cards; sticky CTA with proper glow (no detached hero).
// P1: progress indicator; copy aligned with DS ("Editorial Authority", not "magic");
//     positive escape label.
// P2: theme toggle removed; consistent icon vocabulary; account-less header.
// Follows DESIGN.md: surface tonal layering, primary gradient CTA,
// 16/24px radii, no 1px dividers, ambient cyan glow.

// ───────────────────────────────────────────────────────────────
// Tokens
// ───────────────────────────────────────────────────────────────
const K = {
  bg: '#131313',
  s1: '#1c1b1b',           // surface-container-low
  s2: '#2a2a2a',           // surface-container-high
  s3: '#353534',           // surface-container-highest
  primary: '#00E5FF',
  primaryDeep: '#00daf3',
  primaryDim: 'rgba(0,229,255,0.10)',
  primarySoft: 'rgba(0,229,255,0.20)',
  primaryGrad: 'linear-gradient(45deg, #00E5FF 0%, #00daf3 100%)',
  secondary: '#98d0da',
  gold: '#ffeac0',
  text: '#f5f6f7',
  text2: 'rgba(245,246,247,0.62)',
  text3: 'rgba(245,246,247,0.36)',
  ghost: 'rgba(255,255,255,0.08)',
  ghostHi: 'rgba(255,255,255,0.15)',
  font: 'Inter, -apple-system, system-ui, sans-serif',
};

const GOALS = [
  { id: 'loss', title: 'Perda de Peso', sub: 'Déficit calórico + condicionamento metabólico',
    icon: (<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l5-5 4 4 8-9"/><path d="M14 7h6v6"/></svg>) },
  { id: 'mass', title: 'Ganho de Massa', sub: 'Hipertrofia + sobrecarga progressiva',
    icon: (<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="9" width="3" height="6" rx="1"/><rect x="17" y="9" width="3" height="6" rx="1"/><rect x="7" y="10" width="2" height="4"/><rect x="15" y="10" width="2" height="4"/><path d="M9 12h6"/></svg>) },
  { id: 'perf', title: 'Desempenho', sub: 'Força máxima, explosão e resistência',
    icon: (<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/></svg>) },
];

const LEVELS = [
  { id: 'beg', title: 'Iniciante', sub: 'Começando agora ou retomando após pausa', dots: 1 },
  { id: 'int', title: 'Intermediário', sub: '6+ meses treinando com consistência', dots: 2 },
  { id: 'pro', title: 'Avançado', sub: 'Anos de prática, técnica refinada', dots: 3 },
];

const DAYS = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];

const STEPS = ['Objetivo', 'Você', 'Experiência', 'Frequência', 'Gerando'];

// ───────────────────────────────────────────────────────────────
// Atoms
// ───────────────────────────────────────────────────────────────
function ProgressDots({ current, total }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {Array.from({ length: total }).map((_, i) => {
        const active = i === current;
        const done = i < current;
        return (
          <div key={i} style={{
            height: 3, borderRadius: 2,
            width: active ? 22 : (done ? 12 : 8),
            background: done || active ? K.primary : K.ghostHi,
            transition: 'all 240ms ease',
          }}/>
        );
      })}
    </div>
  );
}

function TopBar({ step, total, onBack, onSkip }) {
  return (
    <div style={{
      padding: '54px 20px 16px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: K.bg,
    }}>
      <button onClick={onBack} aria-label="Voltar" disabled={step === 0} style={{
        all: 'unset', cursor: step === 0 ? 'default' : 'pointer',
        width: 36, height: 36, borderRadius: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: K.s1, color: step === 0 ? K.text3 : K.text2,
        opacity: step === 0 ? 0.4 : 1,
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
      </button>

      <ProgressDots current={step} total={total}/>

      <button onClick={onSkip} style={{
        all: 'unset', cursor: 'pointer',
        fontFamily: K.font, fontSize: 12, fontWeight: 600,
        color: K.text2, padding: '8px 4px',
        visibility: step === total - 1 ? 'hidden' : 'visible',
      }}>Pular</button>
    </div>
  );
}

function PrimaryCTA({ children, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      all: 'unset', cursor: disabled ? 'not-allowed' : 'pointer',
      width: '100%', boxSizing: 'border-box',
      padding: '18px 20px', borderRadius: 16,
      background: disabled ? K.s2 : K.primaryGrad,
      color: disabled ? K.text3 : '#001a1f',
      fontFamily: K.font, fontWeight: 800, fontSize: 16,
      letterSpacing: 0.4, textAlign: 'center',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      boxShadow: disabled ? 'none' : `0 6px 32px ${K.primarySoft}, 0 0 0 1px rgba(0,229,255,0.25) inset`,
      transition: 'all 200ms ease',
    }}>{children}</button>
  );
}

function StickyFooter({ children }) {
  return (
    <div style={{
      position: 'sticky', bottom: 0,
      padding: '16px 20px 34px',
      background: `linear-gradient(180deg, rgba(19,19,19,0) 0%, ${K.bg} 30%)`,
    }}>{children}</div>
  );
}

function StepHeader({ tag, title, sub }) {
  return (
    <div style={{ padding: '8px 20px 24px' }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '5px 10px', borderRadius: 999,
        background: K.primaryDim,
        color: K.primary, fontFamily: K.font, fontSize: 10, fontWeight: 700,
        letterSpacing: 0.8, textTransform: 'uppercase',
      }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="4"/></svg>
        {tag}
      </div>
      <h1 style={{
        margin: '12px 0 8px', fontFamily: K.font, fontWeight: 800,
        fontSize: 32, lineHeight: 1.05, letterSpacing: -1, color: K.text,
      }}>{title}</h1>
      {sub && <p style={{
        margin: 0, fontFamily: K.font, fontSize: 14, lineHeight: 1.5,
        color: K.text2, maxWidth: 320,
      }}>{sub}</p>}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// Wheel picker — scroll-snap, mobile-native pattern
// ───────────────────────────────────────────────────────────────
function WheelPicker({ values, value, onChange, unit, height = 132 }) {
  const ref = React.useRef(null);
  const adjustingRef = React.useRef(false);
  const adjustTimer = React.useRef(null);
  const itemH = 44;
  const visible = Math.floor(height / itemH); // odd preferred
  const pad = Math.floor(visible / 2) * itemH;

  // Sync external value -> scroll position (instant, no animation)
  React.useEffect(() => {
    const i = values.indexOf(value);
    if (i < 0 || !ref.current) return;
    const target = i * itemH;
    if (Math.abs(ref.current.scrollTop - target) > 2) {
      adjustingRef.current = true;
      ref.current.scrollTop = target;
      // release flag on next frame, after the scroll event from this assignment fires
      clearTimeout(adjustTimer.current);
      adjustTimer.current = setTimeout(() => { adjustingRef.current = false; }, 80);
    }
  }, [value, values]);

  const onScroll = () => {
    if (adjustingRef.current) return; // ignore programmatic scrolls
    const el = ref.current;
    if (!el) return;
    const i = Math.round(el.scrollTop / itemH);
    const v = values[Math.max(0, Math.min(values.length - 1, i))];
    if (v !== value) onChange(v);
  };

  return (
    <div style={{ position: 'relative', height, width: '100%' }}>
      {/* center highlight band */}
      <div style={{
        position: 'absolute', left: 0, right: 0,
        top: '50%', transform: 'translateY(-50%)',
        height: itemH, borderRadius: 12,
        background: K.s2,
        boxShadow: `0 0 0 1px ${K.ghostHi} inset`,
        pointerEvents: 'none',
      }}/>
      {/* gradient mask top/bottom */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `linear-gradient(180deg, ${K.bg} 0%, transparent 22%, transparent 78%, ${K.bg} 100%)`,
        zIndex: 2,
      }}/>
      {/* unit pinned right of band */}
      <div style={{
        position: 'absolute', right: 16,
        top: '50%', transform: 'translateY(-50%)',
        fontFamily: K.font, fontSize: 13, fontWeight: 600, color: K.text3,
        letterSpacing: 0.4, textTransform: 'uppercase', zIndex: 3,
      }}>{unit}</div>

      <div
        ref={ref}
        onScroll={onScroll}
        style={{
          height: '100%', overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
          scrollBehavior: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
        className="kinetic-scroll"
      >
        <div style={{ height: pad }}/>
        {values.map((v, i) => {
          const isCenter = v === value;
          return (
            <div key={v} style={{
              height: itemH, scrollSnapAlign: 'center', scrollSnapStop: 'always',
              display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
              paddingLeft: 28,
              fontFamily: K.font, fontVariantNumeric: 'tabular-nums',
              fontWeight: isCenter ? 800 : 500,
              fontSize: isCenter ? 28 : 20,
              letterSpacing: -0.6,
              color: isCenter ? K.text : K.text3,
              opacity: isCenter ? 1 : Math.max(0.25, 1 - Math.abs(values.indexOf(value) - i) * 0.28),
              transition: 'all 160ms ease',
            }}>{v}</div>
          );
        })}
        <div style={{ height: pad }}/>
      </div>
    </div>
  );
}

function PickerRow({ label, values, value, onChange, unit }) {
  return (
    <div style={{
      background: K.s1, borderRadius: 20, padding: 14,
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        fontFamily: K.font, fontSize: 11, fontWeight: 700,
        letterSpacing: 1, textTransform: 'uppercase',
        color: K.text2, width: 56, flexShrink: 0,
      }}>{label}</div>
      <div style={{ flex: 1 }}>
        <WheelPicker values={values} value={value} onChange={onChange} unit={unit} height={120}/>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// Selectable cards (large vs compact)
// ───────────────────────────────────────────────────────────────
function GoalCard({ goal, selected, onClick }) {
  return (
    <button onClick={onClick} style={{
      all: 'unset', cursor: 'pointer', width: '100%', boxSizing: 'border-box',
      padding: 18, borderRadius: 20,
      background: selected ? `linear-gradient(135deg, ${K.primaryDim} 0%, ${K.s1} 70%)` : K.s1,
      boxShadow: selected ? `0 0 0 1.5px ${K.primary} inset, 0 12px 36px rgba(0,229,255,0.15)` : `0 0 0 1px ${K.ghost} inset`,
      display: 'flex', alignItems: 'center', gap: 14,
      transition: 'all 200ms ease',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: selected ? K.primary : K.s2,
        color: selected ? '#001a1f' : K.primary,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>{goal.icon}</div>
      <div style={{ flex: 1, textAlign: 'left' }}>
        <div style={{
          fontFamily: K.font, fontWeight: 700, fontSize: 17,
          color: K.text, letterSpacing: -0.3,
        }}>{goal.title}</div>
        <div style={{
          fontFamily: K.font, fontSize: 12, color: K.text2,
          marginTop: 3, lineHeight: 1.4,
        }}>{goal.sub}</div>
      </div>
      <div style={{
        width: 22, height: 22, borderRadius: 999,
        background: selected ? K.primary : 'transparent',
        boxShadow: selected ? 'none' : `0 0 0 1.5px ${K.ghostHi} inset`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {selected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#001a1f" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg>}
      </div>
    </button>
  );
}

function LevelDots({ filled, total = 3 }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: 8, height: 8, borderRadius: 999,
          background: i < filled ? K.primary : K.ghostHi,
        }}/>
      ))}
    </div>
  );
}

function LevelCard({ level, selected, onClick }) {
  return (
    <button onClick={onClick} style={{
      all: 'unset', cursor: 'pointer', width: '100%', boxSizing: 'border-box',
      padding: '14px 16px', borderRadius: 16,
      background: selected ? `linear-gradient(135deg, ${K.primaryDim} 0%, ${K.s1} 80%)` : K.s1,
      boxShadow: selected ? `0 0 0 1.5px ${K.primary} inset` : `0 0 0 1px ${K.ghost} inset`,
      display: 'flex', alignItems: 'center', gap: 14,
      transition: 'all 180ms ease',
    }}>
      <div style={{ flex: 1, textAlign: 'left' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontFamily: K.font, fontWeight: 700, fontSize: 15, color: K.text, letterSpacing: -0.2 }}>{level.title}</span>
          <LevelDots filled={level.dots}/>
        </div>
        <div style={{
          fontFamily: K.font, fontSize: 12, color: K.text2, marginTop: 2,
        }}>{level.sub}</div>
      </div>
      <div style={{
        width: 20, height: 20, borderRadius: 999,
        background: selected ? K.primary : 'transparent',
        boxShadow: selected ? 'none' : `0 0 0 1.5px ${K.ghostHi} inset`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {selected && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#001a1f" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg>}
      </div>
    </button>
  );
}

function DayChip({ day, selected, onClick }) {
  return (
    <button onClick={onClick} style={{
      all: 'unset', cursor: 'pointer',
      flex: 1, padding: '14px 0', borderRadius: 14,
      background: selected ? K.primaryGrad : K.s1,
      color: selected ? '#001a1f' : K.text2,
      fontFamily: K.font, fontWeight: 700, fontSize: 12,
      letterSpacing: 0.4, textAlign: 'center',
      textTransform: 'uppercase',
      boxShadow: selected ? `0 4px 16px ${K.primarySoft}` : `0 0 0 1px ${K.ghost} inset`,
      transition: 'all 160ms ease',
    }}>{day}</button>
  );
}

// ───────────────────────────────────────────────────────────────
// STEPS
// ───────────────────────────────────────────────────────────────
function StepGoal({ value, onChange }) {
  return (
    <>
      <StepHeader
        tag="Etapa 1 de 4"
        title="Qual seu objetivo?"
        sub="Escolha um foco principal. Seu protocolo será calibrado para esse resultado."
      />
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {GOALS.map(g => (
          <GoalCard key={g.id} goal={g} selected={value === g.id} onClick={() => onChange(g.id)}/>
        ))}
      </div>
    </>
  );
}

function StepMetrics({ data, onChange }) {
  const ages = Array.from({ length: 73 }, (_, i) => i + 14);   // 14–86
  const weights = Array.from({ length: 161 }, (_, i) => i + 40); // 40–200
  const heights = Array.from({ length: 91 }, (_, i) => i + 140); // 140–230
  return (
    <>
      <StepHeader
        tag="Etapa 2 de 4"
        title="Sobre você"
        sub="Usamos esses dados para calibrar cargas iniciais e estimar gasto calórico."
      />
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <PickerRow label="Idade" unit="anos" values={ages}
          value={data.age} onChange={v => onChange({ ...data, age: v })}/>
        <PickerRow label="Peso" unit="kg" values={weights}
          value={data.weight} onChange={v => onChange({ ...data, weight: v })}/>
        <PickerRow label="Altura" unit="cm" values={heights}
          value={data.height} onChange={v => onChange({ ...data, height: v })}/>
      </div>
    </>
  );
}

function StepLevel({ value, onChange }) {
  return (
    <>
      <StepHeader
        tag="Etapa 3 de 4"
        title="Seu nível"
        sub="Calibra a complexidade dos exercícios e a progressão de carga."
      />
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {LEVELS.map(l => (
          <LevelCard key={l.id} level={l} selected={value === l.id} onClick={() => onChange(l.id)}/>
        ))}
      </div>
    </>
  );
}

function StepFreq({ days, onChange }) {
  const toggle = (i) => {
    const next = days.includes(i) ? days.filter(d => d !== i) : [...days, i].sort();
    onChange(next);
  };
  return (
    <>
      <StepHeader
        tag="Etapa 4 de 4"
        title="Quando você treina?"
        sub="Toque nos dias que você consegue treinar com consistência."
      />
      <div style={{ padding: '0 20px' }}>
        {/* Big count */}
        <div style={{
          padding: '20px 20px 24px', borderRadius: 20, background: K.s1,
          display: 'flex', alignItems: 'center', gap: 16,
          boxShadow: `0 0 0 1px ${K.ghost} inset`,
        }}>
          <div style={{
            fontFamily: K.font, fontWeight: 800, fontSize: 56,
            color: K.primary, letterSpacing: -2, lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
            minWidth: 60, textAlign: 'center',
          }}>{days.length}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: K.font, fontSize: 13, color: K.text2 }}>dias por semana</div>
            <div style={{ fontFamily: K.font, fontSize: 12, color: K.text3, marginTop: 4, lineHeight: 1.4 }}>
              {days.length === 0 && 'Selecione pelo menos 2 dias.'}
              {days.length === 1 && 'Recomendamos no mínimo 2 dias.'}
              {days.length === 2 && 'Bom para manutenção.'}
              {days.length === 3 && 'Ideal para iniciantes.'}
              {days.length === 4 && 'Equilíbrio ótimo entre estímulo e recuperação.'}
              {days.length === 5 && 'Volume alto, divisão por grupo muscular.'}
              {days.length === 6 && 'Avançado. Atenção à recuperação.'}
              {days.length === 7 && 'Inclui dias de mobilidade ativa.'}
            </div>
          </div>
        </div>

        {/* Day chips */}
        <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
          {DAYS.map((d, i) => (
            <DayChip key={i} day={d.slice(0, 1)} selected={days.includes(i)} onClick={() => toggle(i)}/>
          ))}
        </div>

        {/* Hint about anamnese to come */}
        <div style={{
          marginTop: 18, padding: '14px 16px', borderRadius: 14,
          background: K.s1,
          display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <div style={{
            width: 24, height: 24, borderRadius: 8, flexShrink: 0,
            background: K.primaryDim, color: K.primary,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>
          </div>
          <div style={{ fontFamily: K.font, fontSize: 12, color: K.text2, lineHeight: 1.5 }}>
            Após esta etapa, você fará uma <strong style={{ color: K.text }}>anamnese rápida</strong> sobre lesões, equipamento disponível e preferências.
          </div>
        </div>
      </div>
    </>
  );
}

// ───────────────────────────────────────────────────────────────
// Step 5 — Generating
// ───────────────────────────────────────────────────────────────
const STEPS_GEN = [
  'Analisando perfil antropométrico',
  'Cruzando histórico com objetivo selecionado',
  'Calibrando cargas e tempos de descanso',
  'Distribuindo volumes por grupo muscular',
  'Selecionando exercícios compatíveis',
  'Montando ciclo de progressão',
];

function StepGenerating({ form, onDone }) {
  const [progress, setProgress] = React.useState(0);
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    let raf;
    const start = performance.now();
    const dur = 5200;
    const loop = (t) => {
      const p = Math.min(1, (t - start) / dur);
      setProgress(p);
      setTick(Math.floor(p * STEPS_GEN.length));
      if (p < 1) raf = requestAnimationFrame(loop);
      else setTimeout(onDone, 600);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const goalLabel = GOALS.find(g => g.id === form.goal)?.title || '—';

  return (
    <div style={{ padding: '12px 20px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
      <StepHeader
        tag="Construindo seu protocolo"
        title="Calibrando para você"
        sub={`Foco: ${goalLabel} · ${form.days.length} dias/semana`}
      />

      {/* Pulse visual */}
      <div style={{
        position: 'relative', width: 180, height: 180, alignSelf: 'center', marginTop: 8,
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: `1.5px solid ${K.primary}`,
            opacity: 0.6 - i * 0.18,
            animation: `pulse 2400ms ${i * 600}ms ease-out infinite`,
          }}/>
        ))}
        <div style={{
          position: 'absolute', inset: 30, borderRadius: '50%',
          background: K.primaryGrad,
          boxShadow: `0 0 60px ${K.primarySoft}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: K.font, fontWeight: 800, fontSize: 36, color: '#001a1f',
          letterSpacing: -1, fontVariantNumeric: 'tabular-nums',
        }}>{Math.round(progress * 100)}<span style={{ fontSize: 16 }}>%</span></div>
      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.9); opacity: 0.6; }
          100% { transform: scale(1.35); opacity: 0; }
        }
      `}</style>

      {/* Tick list */}
      <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {STEPS_GEN.map((s, i) => {
          const done = i < tick;
          const active = i === tick;
          return (
            <div key={s} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', borderRadius: 12,
              background: active ? K.primaryDim : 'transparent',
              opacity: done ? 0.55 : 1,
              transition: 'all 200ms ease',
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: 999, flexShrink: 0,
                background: done ? K.primary : (active ? 'transparent' : K.s2),
                boxShadow: active ? `0 0 0 1.5px ${K.primary} inset` : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {done && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#001a1f" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg>}
                {active && <div style={{
                  width: 6, height: 6, borderRadius: 999, background: K.primary,
                  animation: 'blink 800ms ease-in-out infinite',
                }}/>}
              </div>
              <div style={{
                fontFamily: K.font, fontSize: 13,
                color: done ? K.text3 : (active ? K.text : K.text2),
                fontWeight: active ? 600 : 500,
              }}>{s}</div>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// Success preview (after generation)
// ───────────────────────────────────────────────────────────────
function StepDone({ form, onRestart }) {
  const goal = GOALS.find(g => g.id === form.goal);
  return (
    <div style={{ padding: '12px 20px 20px' }}>
      <StepHeader
        tag="Protocolo pronto"
        title="Seu treino está calibrado"
        sub="Confira o resumo. Você pode ajustar tudo nas configurações."
      />
      <div style={{
        padding: 18, borderRadius: 20, background: K.s1,
        boxShadow: `0 0 0 1px ${K.ghost} inset`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, background: K.primary, color: '#001a1f',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{goal?.icon}</div>
          <div>
            <div style={{ fontFamily: K.font, fontSize: 11, fontWeight: 700, color: K.text2, letterSpacing: 0.6, textTransform: 'uppercase' }}>Objetivo</div>
            <div style={{ fontFamily: K.font, fontSize: 18, fontWeight: 700, color: K.text, letterSpacing: -0.3 }}>{goal?.title}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { l: 'Idade', v: `${form.age}`, u: 'anos' },
            { l: 'Peso', v: `${form.weight}`, u: 'kg' },
            { l: 'Altura', v: `${form.height}`, u: 'cm' },
            { l: 'Frequência', v: `${form.days.length}`, u: 'dias/sem' },
          ].map(k => (
            <div key={k.l} style={{ padding: 12, borderRadius: 12, background: K.s2 }}>
              <div style={{ fontFamily: K.font, fontSize: 10, fontWeight: 700, color: K.text3, letterSpacing: 0.6, textTransform: 'uppercase' }}>{k.l}</div>
              <div style={{ marginTop: 4, display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontFamily: K.font, fontWeight: 800, fontSize: 24, color: K.text, letterSpacing: -0.6, fontVariantNumeric: 'tabular-nums' }}>{k.v}</span>
                <span style={{ fontFamily: K.font, fontSize: 11, color: K.text3 }}>{k.u}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={onRestart} style={{
        all: 'unset', cursor: 'pointer', marginTop: 16,
        fontFamily: K.font, fontSize: 12, color: K.text2,
        width: '100%', textAlign: 'center', padding: 12,
      }}>← Refazer onboarding</button>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// Root flow
// ───────────────────────────────────────────────────────────────
function OnboardingFlow() {
  const [step, setStep] = React.useState(() => {
    const s = localStorage.getItem('kinetic_step');
    return s ? parseInt(s, 10) : 0;
  });
  const [form, setForm] = React.useState(() => {
    const f = localStorage.getItem('kinetic_form');
    return f ? JSON.parse(f) : {
      goal: 'mass', age: 25, weight: 78, height: 175, level: 'int', days: [0, 2, 4, 5],
    };
  });
  const [showDone, setShowDone] = React.useState(false);

  React.useEffect(() => { localStorage.setItem('kinetic_step', step); }, [step]);
  React.useEffect(() => { localStorage.setItem('kinetic_form', JSON.stringify(form)); }, [form]);

  const total = 5;
  const canAdvance = (() => {
    if (step === 0) return !!form.goal;
    if (step === 1) return form.age && form.weight && form.height;
    if (step === 2) return !!form.level;
    if (step === 3) return form.days.length >= 2;
    return true;
  })();

  const ctaLabel = step === 3 ? 'Gerar Treino com IA' : 'Continuar';

  return (
    <div style={{
      background: K.bg, color: K.text, fontFamily: K.font,
      height: '100%', display: 'flex', flexDirection: 'column',
      position: 'relative',
    }}>
      {!showDone && step < 4 && (
        <TopBar step={step} total={total}
          onBack={() => setStep(Math.max(0, step - 1))}
          onSkip={() => setStep(Math.min(4, step + 1))}/>
      )}

      <div style={{ flex: 1, overflowY: 'auto' }} className="kinetic-scroll">
        {showDone ? (
          <StepDone form={form} onRestart={() => {
            localStorage.removeItem('kinetic_step');
            localStorage.removeItem('kinetic_form');
            setShowDone(false); setStep(0);
            setForm({ goal: '', age: 25, weight: 78, height: 175, level: '', days: [] });
          }}/>
        ) : (
          <>
            {step === 0 && <StepGoal value={form.goal} onChange={v => setForm({ ...form, goal: v })}/>}
            {step === 1 && <StepMetrics data={form} onChange={v => setForm(v)}/>}
            {step === 2 && <StepLevel value={form.level} onChange={v => setForm({ ...form, level: v })}/>}
            {step === 3 && <StepFreq days={form.days} onChange={v => setForm({ ...form, days: v })}/>}
            {step === 4 && <StepGenerating form={form} onDone={() => setShowDone(true)}/>}
          </>
        )}
      </div>

      {!showDone && step < 4 && (
        <StickyFooter>
          <PrimaryCTA disabled={!canAdvance} onClick={() => setStep(step + 1)}>
            {ctaLabel}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          </PrimaryCTA>
          {step === 0 && (
            <button style={{
              all: 'unset', cursor: 'pointer',
              width: '100%', marginTop: 12, padding: 10,
              textAlign: 'center', fontFamily: K.font, fontSize: 13,
              color: K.text2, fontWeight: 500,
            }}>Já tenho conta · Entrar</button>
          )}
        </StickyFooter>
      )}
    </div>
  );
}

window.OnboardingFlow = OnboardingFlow;
