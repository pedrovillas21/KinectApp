// treino-sessao.jsx — Kinetic · Sessão de treino ativa (registro de séries)
// Resolve os problemas identificados na revisão da tela de execução:
// 1) confirmação de série pouco visível  2) hierarquia invertida do CTA
// 3) estado ambíguo por série  4) telas desconectadas (timer/identidade + registro)
// 5) timer com ênfase exagerada  6) pré-preenchimento inconsistente
// 7) mistura de idiomas  8) falta de progresso  9) confirmação longe do input
// 10) "Sair da sessão" colado no CTA  11) tag "Sem carga (RPE 3)" fundida
// 12) sino de notificação durante a sessão

const HKT = {
  bg: '#131313', s1: '#1c1b1b', s2: '#242423', s3: '#353534',
  primary: '#00E5FF',
  primaryDim: 'rgba(0,229,255,0.10)', primarySoft: 'rgba(0,229,255,0.22)',
  primaryGrad: 'linear-gradient(135deg, #00E5FF 0%, #00bcd4 100%)',
  success: '#4ade80', successDim: 'rgba(74,222,128,0.12)', successSoft: 'rgba(74,222,128,0.28)',
  text: '#f5f6f7', text2: 'rgba(245,246,247,0.62)', text3: 'rgba(245,246,247,0.36)',
  ghost: 'rgba(255,255,255,0.08)', ghostHi: 'rgba(255,255,255,0.15)',
  font: 'Inter, -apple-system, system-ui, sans-serif',
};

// ─── Dados mock (mesmos exercícios da ficha Pull Day) ───────────
const EXERCICIOS = [
  {
    nome: 'Dislocação de Ombro com Bastão (Ativação Escapular)', foco: 'Ombro',
    seriesMeta: [
      { reps: 12, cargaLabel: 'Sem carga', pesoRequired: false, rpe: 3, descanso: '30s' },
      { reps: 12, cargaLabel: 'Sem carga', pesoRequired: false, rpe: 3, descanso: '30s' },
      { reps: 12, cargaLabel: 'Sem carga', pesoRequired: false, rpe: 3, descanso: '30s' },
    ],
  },
  {
    nome: 'Barra Fixa Pronada', foco: 'Costas',
    seriesMeta: [
      { reps: 8, cargaLabel: 'Peso corporal', pesoRequired: false, rpe: 8, descanso: '90s' },
      { reps: 8, cargaLabel: 'Peso corporal', pesoRequired: false, rpe: 8, descanso: '90s' },
      { reps: 8, cargaLabel: 'Peso corporal', pesoRequired: false, rpe: 8, descanso: '90s' },
      { reps: 8, cargaLabel: 'Peso corporal', pesoRequired: false, rpe: 8, descanso: '90s' },
    ],
  },
  {
    nome: 'Remada Curvada', foco: 'Costas',
    seriesMeta: [
      { reps: 10, cargaLabel: '40 kg', pesoPrefill: '40', pesoRequired: true, rpe: 8, descanso: '90s' },
      { reps: 10, cargaLabel: '40 kg', pesoPrefill: '40', pesoRequired: true, rpe: 8, descanso: '90s' },
      { reps: 10, cargaLabel: '40 kg', pesoPrefill: '40', pesoRequired: true, rpe: 8, descanso: '90s' },
      { reps: 10, cargaLabel: '40 kg', pesoPrefill: '40', pesoRequired: true, rpe: 8, descanso: '90s' },
    ],
  },
];

// ─── Ícones ──────────────────────────────────────────────────────
function IcChevronLeft() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 6l-7 6 7 6" />
    </svg>
  );
}
function IcCheck({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}
function IcClock() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function IcLock() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 018 0v3" />
    </svg>
  );
}
function IcInfo() {
  return (
    <svg width="10.5" height="10.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 16v-5M12 8h.01" />
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

// ─── Barra superior: sair (esquerda) · progresso · tempo (direita, discreto) ──
function TopBar({ indice, total, elapsed, onSair }) {
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  return (
    <div style={{ padding: '52px 16px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button onClick={onSair} style={{
          all: 'unset', cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 6,
          color: HKT.text2, fontFamily: HKT.font, fontSize: 12.5, fontWeight: 600,
        }}>
          <span style={{
            width: 26, height: 26, borderRadius: 8, background: HKT.s1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: HKT.text,
          }}><IcChevronLeft /></span>
          Sair da sessão
        </button>

        {/* Timer: só dado de referência, por isso discreto — não compete com o fluxo */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          color: HKT.text3, fontFamily: HKT.font, fontSize: 11.5, fontWeight: 600,
          fontVariantNumeric: 'tabular-nums',
        }}>
          <IcClock /> {mm}:{ss}
        </div>
      </div>

      {/* Progresso de exercícios — sempre visível, une identidade + execução numa só tela */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontFamily: HKT.font, fontSize: 11.5, fontWeight: 700, color: HKT.text2, letterSpacing: 0.2 }}>
          Exercício {indice + 1} de {total}
        </span>
      </div>
      <div style={{ height: 4, borderRadius: 999, background: HKT.ghost, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${((indice + 1) / total) * 100}%`,
          background: HKT.primaryGrad, borderRadius: 999, transition: 'width 240ms ease',
        }} />
      </div>
    </div>
  );
}

function ExerciseHeader({ nome, foco }) {
  return (
    <div style={{ padding: '20px 16px 4px' }}>
      <div style={{
        fontFamily: HKT.font, fontSize: 21, fontWeight: 800,
        color: HKT.text, letterSpacing: -0.4, lineHeight: 1.15, marginBottom: 8,
      }}>{nome.toUpperCase()}</div>
      <span style={{
        display: 'inline-flex', padding: '3px 10px', borderRadius: 999,
        background: HKT.primaryDim, border: `1px solid ${HKT.primarySoft}`,
        fontFamily: HKT.font, fontSize: 11, fontWeight: 700, color: HKT.primary,
      }}>Foco: {foco}</span>
    </div>
  );
}

// Legenda de RPE mostrada uma única vez por exercício, não repetida em cada card
function RpeLegend() {
  return (
    <div style={{
      margin: '12px 16px 0', display: 'flex', gap: 6, alignItems: 'flex-start',
      fontFamily: HKT.font, fontSize: 11, color: HKT.text3, lineHeight: 1.4,
    }}>
      <span style={{ marginTop: 1, flexShrink: 0 }}><IcInfo /></span>
      RPE = esforço percebido, de 1 (muito leve) a 10 (esforço máximo).
    </div>
  );
}

// ─── Card de série ───────────────────────────────────────────────
function SeriesCard({ numero, meta, valores, status, locked, confirmStyle, onChange, onConfirm, onEditar }) {
  const confirmada = status === 'confirmada';
  const atual = status === 'atual';

  const podeConfirmar = !locked && (
    String(valores.reps).trim() !== '' &&
    (!meta.pesoRequired || String(valores.peso).trim() !== '')
  );

  const borderColor = confirmada ? HKT.successSoft : atual ? HKT.primarySoft : 'transparent';
  const glow = atual ? `0 0 0 1px ${HKT.primarySoft}, 0 8px 24px rgba(0,229,255,0.08)` : 'none';

  return (
    <div style={{
      background: HKT.s1, borderRadius: 18, overflow: 'hidden',
      border: `1px solid ${borderColor}`, boxShadow: glow,
      opacity: locked ? 0.55 : 1, transition: 'opacity 160ms ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', rowGap: 6, padding: '14px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', minWidth: 0 }}>
          <span style={{ fontFamily: HKT.font, fontSize: 15.5, fontWeight: 800, color: HKT.text, whiteSpace: 'nowrap', flexShrink: 0 }}>
            Série {String(numero).padStart(2, '0')}
          </span>
          {confirmada && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', flexShrink: 0,
              padding: '2px 8px', borderRadius: 999, background: HKT.successDim,
              color: HKT.success, fontFamily: HKT.font, fontSize: 10.5, fontWeight: 700,
            }}><IcCheck size={10} /> Confirmada</span>
          )}
          {atual && (
            <span style={{
              whiteSpace: 'nowrap', flexShrink: 0,
              padding: '2px 8px', borderRadius: 999, background: HKT.primaryDim,
              color: HKT.primary, fontFamily: HKT.font, fontSize: 10.5, fontWeight: 700,
            }}>Em andamento</span>
          )}
          {locked && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', flexShrink: 0,
              color: HKT.text3, fontFamily: HKT.font, fontSize: 10.5, fontWeight: 600,
            }}><IcLock /> Bloqueada</span>
          )}
        </div>
        {confirmada && (
          <button onClick={onEditar} style={{
            all: 'unset', cursor: 'pointer', color: HKT.text3, whiteSpace: 'nowrap', flexShrink: 0,
            fontFamily: HKT.font, fontSize: 11, fontWeight: 600, textDecoration: 'underline',
          }}>Editar</button>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '10px 16px 0' }}>
        <span style={{ padding: '3px 9px', borderRadius: 999, background: HKT.ghost, fontFamily: HKT.font, fontSize: 10.5, fontWeight: 600, color: HKT.text2 }}>{meta.reps} reps</span>
        <span style={{ padding: '3px 9px', borderRadius: 999, background: HKT.ghost, fontFamily: HKT.font, fontSize: 10.5, fontWeight: 600, color: HKT.text2 }}>{meta.cargaLabel}</span>
        <span style={{ padding: '3px 9px', borderRadius: 999, background: HKT.ghost, fontFamily: HKT.font, fontSize: 10.5, fontWeight: 600, color: HKT.text2 }}>RPE {meta.rpe}</span>
        <span style={{ padding: '3px 9px', borderRadius: 999, background: HKT.ghost, fontFamily: HKT.font, fontSize: 10.5, fontWeight: 600, color: HKT.text2 }}>{meta.descanso} descanso</span>
      </div>

      {confirmada ? (
        <div style={{ display: 'flex', gap: 24, padding: '12px 16px 16px' }}>
          <div>
            <div style={{ fontFamily: HKT.font, fontSize: 9.5, fontWeight: 700, color: HKT.text3, letterSpacing: 0.5, marginBottom: 3 }}>PESO REALIZADO</div>
            <div style={{ fontFamily: HKT.font, fontSize: 15, fontWeight: 700, color: HKT.text }}>{meta.pesoRequired ? `${valores.peso} kg` : '—'}</div>
          </div>
          <div>
            <div style={{ fontFamily: HKT.font, fontSize: 9.5, fontWeight: 700, color: HKT.text3, letterSpacing: 0.5, marginBottom: 3 }}>REPS REALIZADAS</div>
            <div style={{ fontFamily: HKT.font, fontSize: 15, fontWeight: 700, color: HKT.text }}>{valores.reps}</div>
          </div>
        </div>
      ) : (
        <div style={{ padding: '12px 16px 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <div style={{ fontFamily: HKT.font, fontSize: 9.5, fontWeight: 700, color: HKT.text3, letterSpacing: 0.5, marginBottom: 5 }}>PESO REALIZADO (KG)</div>
              <input
                type="number" inputMode="decimal"
                value={valores.peso}
                placeholder={meta.pesoRequired ? '0' : '— (sem carga)'}
                disabled={locked || !meta.pesoRequired && false}
                readOnly={locked}
                onChange={e => onChange({ ...valores, peso: e.target.value })}
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 11,
                  background: HKT.bg, color: HKT.text, fontFamily: HKT.font, fontSize: 14, fontWeight: 700,
                  border: `1.5px solid ${atual ? HKT.primarySoft : HKT.ghostHi}`, outline: 'none',
                }}
              />
            </div>
            <div>
              <div style={{ fontFamily: HKT.font, fontSize: 9.5, fontWeight: 700, color: HKT.text3, letterSpacing: 0.5, marginBottom: 5 }}>REPS REALIZADAS</div>
              <input
                type="number" inputMode="numeric"
                value={valores.reps}
                placeholder={String(meta.reps)}
                readOnly={locked}
                onChange={e => onChange({ ...valores, reps: e.target.value })}
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 11,
                  background: HKT.bg, color: HKT.text, fontFamily: HKT.font, fontSize: 14, fontWeight: 700,
                  border: `1.5px solid ${atual ? HKT.primarySoft : HKT.ghostHi}`, outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Confirmação: perto do input, sempre visível e com rótulo — não mais um ícone cinza escondido */}
          <button
            onClick={onConfirm}
            disabled={!podeConfirmar}
            style={{
              all: 'unset', cursor: podeConfirmar ? 'pointer' : 'not-allowed',
              width: '100%', boxSizing: 'border-box',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              padding: '11px 0', borderRadius: 11,
              background: podeConfirmar ? (atual ? HKT.primaryGrad : HKT.ghost) : HKT.ghost,
              color: podeConfirmar ? (atual ? '#001f24' : HKT.text2) : HKT.text3,
              fontFamily: HKT.font, fontWeight: 800, fontSize: 12.5, letterSpacing: 0.2,
              opacity: locked ? 0.5 : 1,
            }}
          >
            <IcCheck size={13} />
            {confirmStyle === 'icone' ? 'Confirmar' : locked ? 'Confirme a série anterior' : 'Confirmar série'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── CTA inferior: bloqueado até todas as séries serem confirmadas ─────
function BottomCTA({ confirmadas, total, ultimoExercicio, onProximo }) {
  const pronto = confirmadas === total;
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 60,
      padding: '14px 16px 22px',
      background: `linear-gradient(to bottom, transparent, ${HKT.bg} 40%, ${HKT.bg})`,
    }}>
      {!pronto && (
        <div style={{
          textAlign: 'center', marginBottom: 9,
          fontFamily: HKT.font, fontSize: 11.5, fontWeight: 600, color: HKT.text3,
        }}>{confirmadas} de {total} séries confirmadas</div>
      )}
      <button
        onClick={pronto ? onProximo : undefined}
        disabled={!pronto}
        style={{
          all: 'unset', cursor: pronto ? 'pointer' : 'not-allowed',
          width: '100%', boxSizing: 'border-box',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '15px 0', borderRadius: 14,
          background: pronto ? HKT.primaryGrad : HKT.s2,
          color: pronto ? '#001f24' : HKT.text3,
          fontFamily: HKT.font, fontWeight: 800, fontSize: 15, letterSpacing: 0.2,
          boxShadow: pronto ? '0 6px 18px rgba(0,0,0,0.35)' : 'none',
          transition: 'all 160ms ease',
        }}
      >
        {ultimoExercicio && pronto ? 'Finalizar treino' : 'Próximo exercício'} <IcArrow />
      </button>
    </div>
  );
}

// ─── Tela principal ─────────────────────────────────────────────
function TreinoSessaoScreen({ tweaks }) {
  const confirmStyle = tweaks.confirmar || 'texto';
  const ordem = tweaks.ordem || 'sequencial';

  const [indiceEx, setIndiceEx] = React.useState(0);
  const [elapsed, setElapsed] = React.useState(26);

  function estadoInicial(exIdx) {
    return EXERCICIOS[exIdx].seriesMeta.map(m => ({
      confirmada: false,
      peso: m.pesoPrefill || '',
      reps: String(m.reps),
    }));
  }
  const [seriesPorExercicio, setSeriesPorExercicio] = React.useState(() => estadoInicial(0));

  React.useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const exercicio = EXERCICIOS[indiceEx];
  const totalSeries = exercicio.seriesMeta.length;
  const confirmadasCount = seriesPorExercicio.filter(s => s.confirmada).length;
  const primeiroPendente = seriesPorExercicio.findIndex(s => !s.confirmada);

  function updateValores(i, novos) {
    setSeriesPorExercicio(prev => prev.map((s, idx) => idx === i ? { ...s, ...novos } : s));
  }
  function confirmar(i) {
    setSeriesPorExercicio(prev => prev.map((s, idx) => idx === i ? { ...s, confirmada: true } : s));
  }
  function editar(i) {
    setSeriesPorExercicio(prev => prev.map((s, idx) => idx === i ? { ...s, confirmada: false } : s));
  }
  function proximoExercicio() {
    if (indiceEx < EXERCICIOS.length - 1) {
      const next = indiceEx + 1;
      setIndiceEx(next);
      setSeriesPorExercicio(estadoInicial(next));
    }
  }

  return (
    <div data-screen-label="Sessão Ativa — Registro de Série" style={{
      background: HKT.bg, color: HKT.text, fontFamily: HKT.font,
      height: '100%', display: 'flex', flexDirection: 'column',
      position: 'relative',
    }}>
      <TopBar indice={indiceEx} total={EXERCICIOS.length} elapsed={elapsed} onSair={() => {}} />

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 128 }} className="kinetic-scroll">
        <ExerciseHeader nome={exercicio.nome} foco={exercicio.foco} />
        <RpeLegend />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '14px 16px 0' }}>
          {exercicio.seriesMeta.map((meta, i) => {
            const valores = seriesPorExercicio[i];
            const status = valores.confirmada ? 'confirmada' : i === primeiroPendente ? 'atual' : 'pendente';
            const locked = ordem === 'sequencial' && status === 'pendente' && i > primeiroPendente;
            return (
              <SeriesCard
                key={i} numero={i + 1} meta={meta} valores={valores}
                status={status} locked={locked} confirmStyle={confirmStyle}
                onChange={v => updateValores(i, v)}
                onConfirm={() => confirmar(i)}
                onEditar={() => editar(i)}
              />
            );
          })}
        </div>
      </div>

      <BottomCTA
        confirmadas={confirmadasCount} total={totalSeries}
        ultimoExercicio={indiceEx === EXERCICIOS.length - 1}
        onProximo={proximoExercicio}
      />
    </div>
  );
}

window.TreinoSessaoScreen = TreinoSessaoScreen;
