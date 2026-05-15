// home.jsx — Kinetic · Home Screen revisada
// P0: estado vazio real vs normal · idioma PT-BR · "Aderência" · ring compacto · card único próximo treino
// P1: gráfico com valores · ranking compacto + "Você" destacado + deltas · tab bar com ícones distintos
// P2: bronze correto · ordinais º · ciano semântico no display

// ─── Tokens ───────────────────────────────────────────────────
const HK = {
  bg: '#131313', s1: '#1c1b1b', s2: '#2a2a2a', s3: '#353534',
  primary: '#00E5FF', primaryDeep: '#00daf3',
  primaryDim: 'rgba(0,229,255,0.10)', primarySoft: 'rgba(0,229,255,0.20)',
  primaryGrad: 'linear-gradient(45deg, #00E5FF 0%, #00daf3 100%)',
  text: '#f5f6f7', text2: 'rgba(245,246,247,0.62)', text3: 'rgba(245,246,247,0.36)',
  ghost: 'rgba(255,255,255,0.08)', ghostHi: 'rgba(255,255,255,0.15)',
  success: '#4ade80', successDim: 'rgba(74,222,128,0.14)',
  warn: '#f5b945',
  gold: '#F5C518', silver: '#B0B8C1', bronze: '#CD7F32',
  font: 'Inter, -apple-system, system-ui, sans-serif',
};

// ─── Mock data ─────────────────────────────────────────────────
const MOCK = {
  user: { name: 'Gabriel', streak: 3 },
  nextWorkout: {
    tag: 'PUSH · DIA 3 DE 5',
    name: 'Peito + Tríceps',
    duration: 52, exercises: 8,
    muscles: 'Peito · Tríceps · Ombro Anterior',
  },
  adherence: { done: 12, total: 20 },
  ranking: [
    { pos: 1, name: 'Alex Sterling',   min: 340, delta: +12, online: true  },
    { pos: 2, name: 'Marcus Chen',     min: 290, delta:  -5, online: false },
    { pos: 3, name: 'Sarah Jenkins',   min: 215, delta: +18, online: true  },
    { pos: 4, name: 'Você',            min: 180, delta: +22, isUser: true  },
  ],
  weekly: [
    { day: 'Dom', min: 0  },
    { day: 'Seg', min: 45 },
    { day: 'Ter', min: 60 },
    { day: 'Qua', min: 30 },
    { day: 'Qui', min: 55 },
    { day: 'Sex', min: 75, today: true },
    { day: 'Sáb', min: 0  },
  ],
};

// ─── Shared atoms ──────────────────────────────────────────────
function PosColor(pos) {
  if (pos === 1) return HK.gold;
  if (pos === 2) return HK.silver;
  if (pos === 3) return HK.bronze;
  return HK.text3;
}

// ─── Tab bar ───────────────────────────────────────────────────
const TAB_ICONS = {
  home: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  train: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4v16M18 4v16M3 8h3M3 16h3M18 8h3M18 16h3M6 12h12"/>
    </svg>
  ),
  stats: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 20h18M6 20V10M11 20V4M16 20v-7M21 20V8"/>
    </svg>
  ),
  social: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  profile: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
};

function HomeTabBar({ active, onChange }) {
  const tabs = [
    { id: 'home',    label: 'Home'   },
    { id: 'train',   label: 'Treinar'},
    { id: 'stats',   label: 'Stats'  },
    { id: 'social',  label: 'Social' },
    { id: 'profile', label: 'Perfil' },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 70,
      paddingBottom: 26, paddingTop: 0,
      background: `linear-gradient(180deg, rgba(19,19,19,0) 0%, rgba(19,19,19,0.96) 28%, #131313 100%)`,
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
                background: a ? HK.primaryDim : 'transparent',
                border: a ? `1px solid ${HK.primarySoft}` : '1px solid transparent',
                color: a ? HK.primary : HK.text3,
                transition: 'all 160ms ease',
              }}>{TAB_ICONS[t.id]}</div>
              <span style={{
                fontFamily: HK.font, fontSize: 10, fontWeight: a ? 700 : 500,
                color: a ? HK.primary : HK.text3, letterSpacing: 0.3,
              }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Top bar ───────────────────────────────────────────────────
function HomeTopBar({ streak }) {
  return (
    <div style={{
      padding: '56px 20px 14px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: HK.bg, position: 'sticky', top: 0, zIndex: 10,
    }}>
      <span style={{
        fontFamily: HK.font, fontWeight: 900, fontSize: 22,
        color: HK.text, letterSpacing: -0.5,
      }}>KINETIC</span>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {streak > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 10px', borderRadius: 999,
            background: 'rgba(245,197,24,0.12)',
            border: '1px solid rgba(245,197,24,0.25)',
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#F5C518" stroke="#F5C518" strokeWidth="0"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/></svg>
            <span style={{ fontFamily: HK.font, fontSize: 12, fontWeight: 700, color: HK.gold }}>
              {streak} dias
            </span>
          </div>
        )}
        <button aria-label="Notificações" style={{
          all: 'unset', cursor: 'pointer',
          width: 36, height: 36, borderRadius: 11,
          background: HK.s1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: HK.text2,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Greeting ──────────────────────────────────────────────────
function GreetingSection({ name, streak }) {
  const hour = new Date().getHours();
  const saudacao = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  return (
    <div style={{ padding: '4px 20px 18px' }}>
      <div style={{ fontFamily: HK.font, fontSize: 13, color: HK.text2, fontWeight: 500 }}>
        {saudacao}, <span style={{ color: HK.text, fontWeight: 700 }}>{name}</span>.
      </div>
      <div style={{
        fontFamily: HK.font, fontSize: 26, fontWeight: 800, color: HK.text,
        letterSpacing: -0.8, lineHeight: 1.1, marginTop: 4,
      }}>
        {streak >= 3
          ? <>{streak}º dia seguido.<br/><span style={{ color: HK.primary }}>Mantenha o ritmo.</span></>
          : <>Hoje é dia<br/>de<span style={{ color: HK.primary }}> evoluir.</span></>
        }
      </div>
    </div>
  );
}

// ─── Next Workout Card (hero) ───────────────────────────────────
function NextWorkoutCard({ workout }) {
  return (
    <div style={{
      margin: '0 16px',
      background: HK.s1, borderRadius: 24,
      overflow: 'hidden', position: 'relative',
      boxShadow: `0 8px 40px ${HK.primaryDim}`,
    }}>
      {/* top accent stripe */}
      <div style={{
        height: 3,
        background: HK.primaryGrad,
      }}/>

      <div style={{ padding: '16px 18px 18px' }}>
        {/* tag */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 10,
          padding: '4px 10px', borderRadius: 999,
          background: HK.primaryDim,
          fontFamily: HK.font, fontSize: 10, fontWeight: 700,
          color: HK.primary, letterSpacing: 0.8, textTransform: 'uppercase',
        }}>{workout.tag}</div>

        {/* name + meta */}
        <div style={{
          fontFamily: HK.font, fontSize: 26, fontWeight: 800,
          color: HK.text, letterSpacing: -0.7, lineHeight: 1.1,
        }}>{workout.name}</div>

        <div style={{
          display: 'flex', gap: 14, marginTop: 8, alignItems: 'center',
          fontFamily: HK.font, fontSize: 12, color: HK.text2, fontWeight: 500,
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {workout.duration} min
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4v16M18 4v16M3 8h3M18 8h3M3 16h3M18 16h3M6 12h12"/></svg>
            {workout.exercises} exercícios
          </span>
        </div>

        <div style={{
          marginTop: 4, fontFamily: HK.font, fontSize: 11, color: HK.text3,
        }}>{workout.muscles}</div>

        {/* CTA */}
        <button style={{
          all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 8,
          width: '100%', boxSizing: 'border-box',
          marginTop: 16, padding: '15px 0', borderRadius: 14,
          background: HK.primaryGrad,
          color: '#001a1f', fontFamily: HK.font, fontWeight: 800, fontSize: 15,
          letterSpacing: 0.3,
          boxShadow: `0 4px 28px ${HK.primarySoft}`,
        }}>
          Começar treino
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3l14 9-14 9V3z"/></svg>
        </button>
      </div>
    </div>
  );
}

// ─── Adherence strip ───────────────────────────────────────────
function AdherenceStrip({ done, total }) {
  const pct = done / total;
  const r = 26, circ = 2 * Math.PI * r;
  return (
    <div style={{
      margin: '12px 16px 0',
      padding: '14px 16px',
      background: HK.s1, borderRadius: 18,
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      {/* Mini ring */}
      <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
        <svg width="64" height="64" viewBox="0 0 64 64">
          <defs>
            <linearGradient id="adhr" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={HK.primary}/>
              <stop offset="100%" stopColor={HK.primaryDeep}/>
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r={r} fill="none" stroke={HK.ghost} strokeWidth="7"/>
          <circle cx="32" cy="32" r={r} fill="none" stroke="url(#adhr)" strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${circ * pct} ${circ * (1 - pct)}`}
            transform="rotate(-90 32 32)"/>
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontFamily: HK.font, fontSize: 14, fontWeight: 800, color: HK.text, letterSpacing: -0.4, lineHeight: 1 }}>{done}</span>
          <span style={{ fontFamily: HK.font, fontSize: 9, color: HK.text3, fontWeight: 600, letterSpacing: 0.2 }}>/{total}</span>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: HK.font, fontSize: 11, color: HK.text2, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>Aderência do mês</div>
        <div style={{
          fontFamily: HK.font, fontSize: 24, fontWeight: 800, color: HK.text,
          letterSpacing: -0.7, marginTop: 2,
          fontVariantNumeric: 'tabular-nums',
        }}>{Math.round(pct * 100)}<span style={{ fontSize: 14, color: HK.text3, fontWeight: 500 }}>%</span></div>
        {/* progress bar */}
        <div style={{ marginTop: 6, height: 4, borderRadius: 99, background: HK.ghost, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 99, width: `${pct * 100}%`,
            background: HK.primaryGrad, transition: 'width 600ms ease',
          }}/>
        </div>
        <div style={{ marginTop: 4, fontFamily: HK.font, fontSize: 11, color: HK.text2 }}>
          {total - done} treinos restantes no mês
        </div>
      </div>
    </div>
  );
}

// ─── Ranking ───────────────────────────────────────────────────
function RankingSection({ items }) {
  return (
    <div style={{ margin: '12px 16px 0' }}>
      {/* header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 10,
      }}>
        <div>
          <div style={{ fontFamily: HK.font, fontSize: 15, fontWeight: 700, color: HK.text, letterSpacing: -0.2 }}>
            Ranking da Arena
          </div>
          <div style={{ fontFamily: HK.font, fontSize: 11, color: HK.text2, marginTop: 2 }}>
            Competição semanal · minutos na arena
          </div>
        </div>
        <button style={{
          all: 'unset', cursor: 'pointer',
          fontFamily: HK.font, fontSize: 11, fontWeight: 600,
          color: HK.primary, padding: '4px 0',
        }}>Ver tudo</button>
      </div>

      {/* rows */}
      <div style={{ background: HK.s1, borderRadius: 18, overflow: 'hidden' }}>
        {items.map((item, idx) => {
          const posColor = PosColor(item.pos);
          const deltaPos = item.delta > 0;
          return (
            <div key={item.pos} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 14px',
              background: item.isUser ? `${HK.primaryDim}` : 'transparent',
              borderTop: idx > 0 ? `1px solid ${HK.ghost}` : 'none',
              position: 'relative',
            }}>
              {/* pos */}
              <div style={{
                width: 28, height: 28, borderRadius: 9,
                background: item.pos <= 3 ? `rgba(${
                  item.pos === 1 ? '245,197,24' : item.pos === 2 ? '176,184,193' : '205,127,50'
                },0.15)` : HK.s2,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{
                  fontFamily: HK.font, fontWeight: 800, fontSize: 12,
                  color: posColor,
                }}>{item.pos}º</span>
              </div>

              {/* avatar placeholder */}
              <div style={{
                width: 34, height: 34, borderRadius: 999, flexShrink: 0,
                background: item.isUser ? HK.primarySoft : HK.s2,
                border: item.isUser ? `1.5px solid ${HK.primary}` : `1.5px solid ${HK.ghost}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: HK.font, fontSize: 13, fontWeight: 700,
                color: item.isUser ? HK.primary : HK.text2,
              }}>
                {item.name.charAt(0)}
              </div>

              {/* name + delta */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: HK.font, fontSize: 14, fontWeight: item.isUser ? 700 : 600,
                  color: item.isUser ? HK.text : HK.text,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{item.name}</div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6, marginTop: 2,
                }}>
                  <span style={{ fontFamily: HK.font, fontSize: 11, color: HK.text2,
                    fontVariantNumeric: 'tabular-nums' }}>
                    {item.min} min
                  </span>
                  <span style={{
                    fontFamily: HK.font, fontSize: 10, fontWeight: 700,
                    color: deltaPos ? HK.success : HK.warn,
                  }}>
                    {deltaPos ? '↑' : '↓'}{Math.abs(item.delta)} vs semana passada
                  </span>
                </div>
              </div>

              {/* online dot or user badge */}
              {item.isUser ? (
                <div style={{
                  padding: '3px 8px', borderRadius: 999,
                  background: HK.primaryDim,
                  fontFamily: HK.font, fontSize: 10, fontWeight: 700,
                  color: HK.primary, flexShrink: 0,
                }}>Você</div>
              ) : (
                <div style={{
                  width: 8, height: 8, borderRadius: 999, flexShrink: 0,
                  background: item.online ? HK.success : HK.ghost,
                  boxShadow: item.online ? `0 0 6px ${HK.success}` : 'none',
                }}/>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Weekly chart ──────────────────────────────────────────────
function WeeklyChart({ data }) {
  const max = Math.max(...data.map(d => d.min), 1);
  return (
    <div style={{ margin: '12px 16px 0', background: HK.s1, borderRadius: 18, padding: '14px 14px 12px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14,
      }}>
        <div style={{ fontFamily: HK.font, fontSize: 13, fontWeight: 700, color: HK.text2, letterSpacing: 0.3, textTransform: 'uppercase', fontSize: 11 }}>
          Atividade da semana
        </div>
        <div style={{ fontFamily: HK.font, fontSize: 10, color: HK.text3, fontWeight: 500 }}>min</div>
      </div>

      {/* bar + Y-axis area */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 0, height: 90, position: 'relative' }}>
        {/* Y grid lines */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {[0.5, 1].map(f => (
            <div key={f} style={{
              position: 'absolute', left: 0, right: 0,
              bottom: `${f * 100}%`,
              borderTop: `1px dashed rgba(255,255,255,0.05)`,
            }}/>
          ))}
        </div>

        {data.map((d, i) => {
          const pct = d.min / max;
          const isRest = d.min === 0;
          const isToday = d.today;
          return (
            <div key={i} style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'flex-end', height: '100%',
              gap: 5,
            }}>
              {/* value label */}
              {!isRest && (
                <div style={{
                  fontFamily: HK.font, fontSize: 9, fontWeight: 700,
                  color: isToday ? HK.primary : HK.text3,
                  fontVariantNumeric: 'tabular-nums',
                }}>{d.min}</div>
              )}
              {isRest && <div style={{ fontSize: 9 }}>&nbsp;</div>}

              {/* bar */}
              <div style={{
                width: '62%', borderRadius: '5px 5px 3px 3px',
                height: isRest ? 4 : `${Math.max(pct * 100, 8)}%`,
                background: isToday
                  ? HK.primaryGrad
                  : isRest
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(0,229,255,0.35)',
                boxShadow: isToday ? `0 0 14px ${HK.primarySoft}` : 'none',
                transition: 'height 400ms ease',
              }}/>

              {/* day label */}
              <div style={{
                fontFamily: HK.font, fontSize: 10, fontWeight: isToday ? 700 : 500,
                color: isToday ? HK.primary : HK.text3, letterSpacing: 0.2,
              }}>{d.day}</div>
            </div>
          );
        })}
      </div>

      {/* total */}
      <div style={{
        marginTop: 12, paddingTop: 10,
        borderTop: `1px solid ${HK.ghost}`,
        display: 'flex', justifyContent: 'space-between',
        fontFamily: HK.font, fontSize: 11, color: HK.text2,
      }}>
        <span>Total semanal</span>
        <span style={{ fontWeight: 700, color: HK.text, fontVariantNumeric: 'tabular-nums' }}>
          {data.reduce((a, d) => a + d.min, 0)} min
        </span>
      </div>
    </div>
  );
}

// ─── Empty state ───────────────────────────────────────────────
function EmptyState({ name }) {
  return (
    <div style={{ padding: '8px 16px 0' }}>
      {/* Greeting */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: HK.font, fontSize: 13, color: HK.text2, fontWeight: 500 }}>
          Bem-vindo, <span style={{ color: HK.text, fontWeight: 700 }}>{name}</span>.
        </div>
        <div style={{
          fontFamily: HK.font, fontSize: 26, fontWeight: 800, color: HK.text,
          letterSpacing: -0.8, lineHeight: 1.15, marginTop: 4,
        }}>
          Vamos montar sua<br/><span style={{ color: HK.primary }}>primeira semana.</span>
        </div>
      </div>

      {/* Hero card */}
      <div style={{
        background: HK.s1, borderRadius: 24, overflow: 'hidden',
        boxShadow: `0 8px 40px ${HK.primaryDim}`,
      }}>
        <div style={{ height: 3, background: HK.primaryGrad }}/>
        <div style={{ padding: '18px 18px 20px' }}>
          <div style={{
            fontFamily: HK.font, fontSize: 14, color: HK.text2, lineHeight: 1.5, marginBottom: 18,
          }}>
            Seu protocolo está calibrado. Responda a anamnese e a IA monta um treino
            {' '}<span style={{ color: HK.text, fontWeight: 600 }}>100% personalizado</span> em menos de 30 segundos.
          </div>
          {/* steps */}
          {[
            { n: '1', label: 'Conclua o onboarding' },
            { n: '2', label: 'Anamnese com a IA' },
            { n: '3', label: 'Seu treino gerado' },
          ].map(s => (
            <div key={s.n} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              marginBottom: 10,
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: 8, flexShrink: 0,
                background: s.n === '1' ? HK.primary : HK.s2,
                color: s.n === '1' ? '#001a1f' : HK.text3,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: HK.font, fontWeight: 800, fontSize: 12,
              }}>{s.n}</div>
              <span style={{ fontFamily: HK.font, fontSize: 13, color: HK.text, fontWeight: 500 }}>{s.label}</span>
            </div>
          ))}
          <button style={{
            all: 'unset', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', boxSizing: 'border-box',
            marginTop: 16, padding: '15px 0', borderRadius: 14,
            background: HK.primaryGrad,
            color: '#001a1f', fontFamily: HK.font, fontWeight: 800, fontSize: 15,
            letterSpacing: 0.3,
            boxShadow: `0 4px 28px ${HK.primarySoft}`,
          }}>
            Gerar meu treino com IA
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3l14 9-14 9V3z"/></svg>
          </button>
        </div>
      </div>

      {/* Ranking teaser (blurred) */}
      <div style={{ position: 'relative', marginTop: 12 }}>
        <div style={{
          background: HK.s1, borderRadius: 18, overflow: 'hidden',
          filter: 'blur(3px)', opacity: 0.5, pointerEvents: 'none',
        }}>
          {[1,2,3].map(i => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
              borderTop: i > 1 ? `1px solid ${HK.ghost}` : 'none',
            }}>
              <div style={{ width: 28, height: 28, borderRadius: 9, background: HK.s2 }}/>
              <div style={{ width: 34, height: 34, borderRadius: 999, background: HK.s2 }}/>
              <div style={{ flex: 1 }}>
                <div style={{ height: 12, width: '50%', borderRadius: 6, background: HK.s2 }}/>
                <div style={{ height: 9, width: '30%', borderRadius: 6, background: HK.s3, marginTop: 5 }}/>
              </div>
            </div>
          ))}
        </div>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 6,
        }}>
          <div style={{
            padding: '6px 14px', borderRadius: 999,
            background: 'rgba(19,19,19,0.85)',
            border: `1px solid ${HK.ghostHi}`,
            fontFamily: HK.font, fontSize: 12, fontWeight: 700, color: HK.text2,
          }}>Complete seu perfil para entrar no ranking</div>
        </div>
      </div>
    </div>
  );
}

// ─── Root ──────────────────────────────────────────────────────
function HomeScreen({ tweaks }) {
  const [tab, setTab] = React.useState('home');
  const isEmpty = tweaks.estado === 'vazio';
  const d = MOCK;

  return (
    <div style={{
      background: HK.bg, color: HK.text, fontFamily: HK.font,
      height: '100%', display: 'flex', flexDirection: 'column',
      position: 'relative',
    }}>
      <HomeTopBar streak={isEmpty ? 0 : d.user.streak}/>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 100 }} className="kinetic-scroll">
        {isEmpty ? (
          <EmptyState name={d.user.name}/>
        ) : (
          <>
            <GreetingSection name={d.user.name} streak={d.user.streak}/>
            <NextWorkoutCard workout={d.nextWorkout}/>
            <AdherenceStrip done={d.adherence.done} total={d.adherence.total}/>
            <RankingSection items={d.ranking}/>
            <WeeklyChart data={d.weekly}/>
            <div style={{ height: 20 }}/>
          </>
        )}
      </div>

      <HomeTabBar active={tab} onChange={setTab}/>
    </div>
  );
}

window.HomeScreen = HomeScreen;
