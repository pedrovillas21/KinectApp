// Stats screen — revised UX
// Fixes (priority order):
// P0 — chart axes/values, coherent trend direction, reframed ring metric, expanded volume chart
// P1 — period filter, KPI summary, consolidated insight
// P2 — icon labels, tap drill-downs

const T = {
  bg: '#0a0d10',
  card: '#15191d',
  cardSoft: '#1b2025',
  border: 'rgba(255,255,255,0.06)',
  borderSoft: 'rgba(255,255,255,0.04)',
  text: '#f5f6f7',
  text2: 'rgba(245,246,247,0.62)',
  text3: 'rgba(245,246,247,0.34)',
  accent: '#1ee0ee',
  accentDim: 'rgba(30,224,238,0.10)',
  accentSoft: 'rgba(30,224,238,0.16)',
  success: '#4ade80',
  successDim: 'rgba(74,222,128,0.14)',
  warn: '#f5b945',
  font: '-apple-system, "SF Pro Text", system-ui, sans-serif',
  fontDisplay: '-apple-system, "SF Pro Display", system-ui, sans-serif',
  fontMono: '"SF Mono", ui-monospace, "JetBrains Mono", monospace',
};

// ───────────────────────────────────────────────────────────────
// Data — drives every chart from the active period
// ───────────────────────────────────────────────────────────────
const PERIODS = [
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mês' },
  { id: 'q', label: '3M' },
  { id: 'year', label: 'Ano' },
];

const DATA = {
  week: {
    weight: { points: [73.2, 73.0, 73.1, 72.8, 72.6, 72.5, 72.4], xLabels: ['S','T','Q','Q','S','S','D'], delta: -0.8, unit: 'kg', current: 72.4, period: 'últimos 7 dias' },
    consistency: { done: 4, total: 5, label: 'treinos' },
    kpis: [
      { label: 'Peso', value: '72,4', unit: 'kg', delta: '-0,8', good: true },
      { label: 'Treinos', value: '4', unit: '/5', delta: '80%', good: true },
      { label: 'Volume', value: '14,2', unit: 't', delta: '+5%', good: true },
    ],
    volume: [
      { id: 'peito', label: 'Peito', value: 1200, delta: 8 },
      { id: 'costas', label: 'Costas', value: 980, delta: -3, rest: false },
      { id: 'pernas', label: 'Pernas', value: 1450, delta: 12 },
      { id: 'ombro', label: 'Ombros', value: 620, delta: 4 },
      { id: 'bracos', label: 'Braços', value: 540, delta: 6 },
      { id: 'core', label: 'Core', value: 0, delta: 0, rest: true },
    ],
    volumeTotal: 14200, volumeDelta: 5,
  },
  month: {
    weight: { points: [74.6, 74.2, 73.8, 73.5, 73.1, 72.9, 72.6, 72.4], xLabels: ['1','5','9','13','17','21','25','30'], delta: -2.2, unit: 'kg', current: 72.4, period: 'últimos 30 dias' },
    consistency: { done: 12, total: 15, label: 'treinos' },
    kpis: [
      { label: 'Peso', value: '72,4', unit: 'kg', delta: '-2,2', good: true },
      { label: 'Treinos', value: '12', unit: '/15', delta: '80%', good: true },
      { label: 'Volume', value: '58,4', unit: 't', delta: '+12%', good: true },
    ],
    volume: [
      { id: 'peito', label: 'Peito', value: 4500, delta: 9 },
      { id: 'costas', label: 'Costas', value: 3800, delta: -2 },
      { id: 'pernas', label: 'Pernas', value: 5200, delta: 14 },
      { id: 'ombro', label: 'Ombros', value: 2400, delta: 5 },
      { id: 'bracos', label: 'Braços', value: 2100, delta: 7 },
      { id: 'core', label: 'Core', value: 1450, delta: 11 },
    ],
    volumeTotal: 19450, volumeDelta: 12,
  },
  q: {
    weight: { points: [76.4, 75.8, 75.1, 74.5, 73.8, 73.2, 72.7, 72.4], xLabels: ['Fev','','Mar','','Abr','','','Mai'], delta: -4.0, unit: 'kg', current: 72.4, period: 'últimos 90 dias' },
    consistency: { done: 38, total: 45, label: 'treinos' },
    kpis: [
      { label: 'Peso', value: '72,4', unit: 'kg', delta: '-4,0', good: true },
      { label: 'Treinos', value: '38', unit: '/45', delta: '84%', good: true },
      { label: 'Volume', value: '178', unit: 't', delta: '+23%', good: true },
    ],
    volume: [
      { id: 'peito', label: 'Peito', value: 13800, delta: 18 },
      { id: 'costas', label: 'Costas', value: 11400, delta: 14 },
      { id: 'pernas', label: 'Pernas', value: 16200, delta: 26 },
      { id: 'ombro', label: 'Ombros', value: 7800, delta: 10 },
      { id: 'bracos', label: 'Braços', value: 6500, delta: 12 },
      { id: 'core', label: 'Core', value: 4400, delta: 22 },
    ],
    volumeTotal: 60100, volumeDelta: 23,
  },
  year: {
    weight: { points: [78.2, 77.5, 77.0, 76.4, 75.8, 75.1, 74.6, 74.0, 73.6, 73.2, 72.8, 72.4], xLabels: ['Jun','Jul','Ago','Set','Out','Nov','Dez','Jan','Fev','Mar','Abr','Mai'], delta: -5.8, unit: 'kg', current: 72.4, period: 'últimos 12 meses' },
    consistency: { done: 158, total: 180, label: 'treinos' },
    kpis: [
      { label: 'Peso', value: '72,4', unit: 'kg', delta: '-5,8', good: true },
      { label: 'Treinos', value: '158', unit: '/180', delta: '88%', good: true },
      { label: 'Volume', value: '724', unit: 't', delta: '+38%', good: true },
    ],
    volume: [
      { id: 'peito', label: 'Peito', value: 56400, delta: 38 },
      { id: 'costas', label: 'Costas', value: 47200, delta: 32 },
      { id: 'pernas', label: 'Pernas', value: 64800, delta: 44 },
      { id: 'ombro', label: 'Ombros', value: 31200, delta: 28 },
      { id: 'bracos', label: 'Braços', value: 27600, delta: 30 },
      { id: 'core', label: 'Core', value: 18200, delta: 41 },
    ],
    volumeTotal: 245400, volumeDelta: 38,
  },
};

// ───────────────────────────────────────────────────────────────
// Atoms
// ───────────────────────────────────────────────────────────────
function Card({ children, style }) {
  return (
    <div style={{
      background: T.card, borderRadius: 22, padding: 18,
      border: `1px solid ${T.border}`,
      boxShadow: '0 1px 0 rgba(255,255,255,0.03) inset',
      ...style,
    }}>{children}</div>
  );
}

function CardHeader({ title, sub, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 600, color: T.text, letterSpacing: -0.2 }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: T.text2, marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

function DeltaChip({ value, good = true, suffix }) {
  const positive = value >= 0;
  const isGood = good ? value <= 0 : value >= 0; // good=true means lower-is-better (weight)
  // for things where higher is good (volume), pass good=false… but we'll keep simple:
  // we'll accept explicit good prop = whether the current direction is favorable.
  // We just color based on `good`.
  const color = good ? T.success : T.warn;
  const bg = good ? T.successDim : 'rgba(245,185,69,0.14)';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 8px', borderRadius: 999, background: bg, color,
      fontSize: 12, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
    }}>
      <span style={{ fontSize: 11 }}>{positive ? '↑' : '↓'}</span>
      {Math.abs(value)}{suffix || ''}
    </span>
  );
}

function IconBtn({ children, label, onClick, active }) {
  return (
    <button onClick={onClick} aria-label={label}
      style={{
        all: 'unset', cursor: 'pointer',
        width: 36, height: 36, borderRadius: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: active ? T.accentDim : 'rgba(255,255,255,0.04)',
        border: `1px solid ${active ? T.accentSoft : T.borderSoft}`,
        color: active ? T.accent : T.text2,
        transition: 'all 120ms ease',
      }}>
      {children}
    </button>
  );
}

// Tiny SVG icons (line, 1.6 stroke)
const Icons = {
  calendar: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>,
  info: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8.5h.01"/></svg>,
  expand: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14v6h6M20 10V4h-6M4 20l7-7M20 4l-7 7"/></svg>,
  scale: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 8h14l2 12H3L5 8z"/><path d="M9 8a3 3 0 016 0M9 13l3-2 3 2"/></svg>,
  spark: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>,
};

// ───────────────────────────────────────────────────────────────
// Period selector — sticky pill row
// ───────────────────────────────────────────────────────────────
function PeriodSelector({ value, onChange }) {
  return (
    <div style={{
      display: 'flex', gap: 6, padding: 4,
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid ${T.borderSoft}`,
      borderRadius: 12,
    }}>
      {PERIODS.map(p => {
        const active = p.id === value;
        return (
          <button key={p.id} onClick={() => onChange(p.id)} style={{
            all: 'unset', flex: 1, textAlign: 'center', cursor: 'pointer',
            padding: '7px 0', borderRadius: 9,
            fontSize: 13, fontWeight: 600,
            background: active ? T.text : 'transparent',
            color: active ? '#0a0d10' : T.text2,
            transition: 'all 160ms ease',
          }}>{p.label}</button>
        );
      })}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// KPI strip — 3 numbers visible at-a-glance
// ───────────────────────────────────────────────────────────────
function KpiStrip({ kpis }) {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      {kpis.map((k, i) => (
        <div key={i} style={{
          flex: 1, padding: '12px 12px 14px',
          background: T.card, borderRadius: 16,
          border: `1px solid ${T.border}`,
        }}>
          <div style={{ fontSize: 11, color: T.text2, fontWeight: 500, letterSpacing: 0.3, textTransform: 'uppercase' }}>{k.label}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginTop: 6, fontFamily: T.fontDisplay }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: T.text, letterSpacing: -0.6, fontVariantNumeric: 'tabular-nums' }}>{k.value}</span>
            <span style={{ fontSize: 11, color: T.text3, fontWeight: 500 }}>{k.unit}</span>
          </div>
          <div style={{
            display: 'inline-flex', marginTop: 4,
            fontSize: 11, fontWeight: 600,
            color: k.good ? T.success : T.warn,
            fontVariantNumeric: 'tabular-nums',
          }}>{k.delta}</div>
        </div>
      ))}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// Consistency ring — 12/15 prominent, % secondary
// ───────────────────────────────────────────────────────────────
function ConsistencyCard({ data, onOpen }) {
  const pct = data.done / data.total;
  const r = 56, c = 2 * Math.PI * r;
  const dash = c * pct;

  return (
    <Card>
      <CardHeader
        title="Frequência"
        sub={`Treinos concluídos · ${data.done} de ${data.total}`}
        right={<IconBtn label="Ver calendário de treinos" onClick={onOpen}>{Icons.calendar}</IconBtn>}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ position: 'relative', width: 132, height: 132, flexShrink: 0 }}>
          <svg width="132" height="132" viewBox="0 0 132 132">
            <defs>
              <linearGradient id="ringg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={T.accent}/>
                <stop offset="100%" stopColor="#0fa5b3"/>
              </linearGradient>
            </defs>
            <circle cx="66" cy="66" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10"/>
            <circle cx="66" cy="66" r={r} fill="none" stroke="url(#ringg)" strokeWidth="10"
              strokeLinecap="round" strokeDasharray={`${dash} ${c - dash}`}
              transform="rotate(-90 66 66)"/>
          </svg>
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            fontFamily: T.fontDisplay,
          }}>
            <div style={{ fontSize: 30, fontWeight: 700, color: T.text, letterSpacing: -1, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
              {data.done}<span style={{ color: T.text3, fontWeight: 500 }}>/{data.total}</span>
            </div>
            <div style={{ fontSize: 10, color: T.text2, marginTop: 4, letterSpacing: 0.5, textTransform: 'uppercase' }}>{data.label}</div>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: T.text2, letterSpacing: 0.3, textTransform: 'uppercase', fontWeight: 500 }}>Aderência</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: T.text, letterSpacing: -0.8, marginTop: 2, fontFamily: T.fontDisplay, fontVariantNumeric: 'tabular-nums' }}>
            {Math.round(pct * 100)}<span style={{ fontSize: 18, color: T.text3 }}>%</span>
          </div>
          <div style={{ fontSize: 12, color: T.text2, marginTop: 8, lineHeight: 1.45 }}>
            <span style={{ color: T.success, fontWeight: 600 }}>↑ acima da média</span> da sua comunidade (68%).
          </div>
        </div>
      </div>
    </Card>
  );
}

// ───────────────────────────────────────────────────────────────
// Weight chart — proper axes, values, tooltip on tap
// ───────────────────────────────────────────────────────────────
function WeightCard({ data, onOpen }) {
  const W = 322, H = 168, padL = 36, padR = 12, padT = 16, padB = 26;
  const xs = data.points;
  const min = Math.min(...xs) - 0.4;
  const max = Math.max(...xs) + 0.4;
  const xStep = (W - padL - padR) / (xs.length - 1);
  const xy = (i, v) => [
    padL + i * xStep,
    padT + (1 - (v - min) / (max - min)) * (H - padT - padB),
  ];
  const path = xs.map((v, i) => `${i === 0 ? 'M' : 'L'}${xy(i, v).join(',')}`).join(' ');
  const area = path + ` L${xy(xs.length - 1, xs[xs.length - 1])[0]},${H - padB} L${xy(0, xs[0])[0]},${H - padB} Z`;

  // Y-axis ticks (3 lines)
  const yTicks = [min + (max - min) * 0.15, min + (max - min) * 0.5, min + (max - min) * 0.85];

  const [hover, setHover] = React.useState(xs.length - 1); // default hover = current

  // map x to nearest index
  const onMove = (e) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const px = ((e.touches?.[0]?.clientX ?? e.clientX) - rect.left) * (W / rect.width);
    const i = Math.max(0, Math.min(xs.length - 1, Math.round((px - padL) / xStep)));
    setHover(i);
  };

  const [hx, hy] = xy(hover, xs[hover]);
  const trendDown = data.delta < 0;

  return (
    <Card>
      <CardHeader
        title="Peso Corporal"
        sub={data.period}
        right={<IconBtn label="Ver histórico completo" onClick={onOpen}>{Icons.expand}</IconBtn>}
      />

      {/* Big number + delta */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
        <span style={{ fontFamily: T.fontDisplay, fontSize: 36, fontWeight: 700, color: T.text, letterSpacing: -1.2, fontVariantNumeric: 'tabular-nums' }}>
          {data.current.toString().replace('.', ',')}
        </span>
        <span style={{ fontSize: 14, color: T.text3, fontWeight: 500 }}>{data.unit}</span>
        <DeltaChip value={data.delta} good={trendDown} suffix={data.unit} />
      </div>

      {/* Chart */}
      <svg
        width="100%" viewBox={`0 0 ${W} ${H}`} style={{ marginTop: 4, touchAction: 'none' }}
        onMouseMove={onMove} onTouchMove={onMove} onMouseDown={onMove} onTouchStart={onMove}
      >
        <defs>
          <linearGradient id="wfill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={T.accent} stopOpacity="0.32"/>
            <stop offset="100%" stopColor={T.accent} stopOpacity="0"/>
          </linearGradient>
        </defs>

        {/* Y axis grid + labels */}
        {yTicks.map((v, i) => {
          const [_, y] = xy(0, v);
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="rgba(255,255,255,0.05)" strokeDasharray="2 4"/>
              <text x={padL - 8} y={y + 4} textAnchor="end"
                fill={T.text3} fontSize="10" fontFamily={T.fontMono} style={{ fontVariantNumeric: 'tabular-nums' }}>
                {v.toFixed(1).replace('.', ',')}
              </text>
            </g>
          );
        })}

        {/* X axis labels */}
        {data.xLabels.map((l, i) => {
          if (!l) return null;
          const [x] = xy(i, xs[i]);
          return (
            <text key={i} x={x} y={H - 6} textAnchor="middle"
              fill={T.text3} fontSize="10" fontFamily={T.font}>{l}</text>
          );
        })}

        {/* area + line */}
        <path d={area} fill="url(#wfill)"/>
        <path d={path} fill="none" stroke={T.accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>

        {/* hover guideline */}
        <line x1={hx} y1={padT} x2={hx} y2={H - padB} stroke="rgba(30,224,238,0.35)" strokeWidth="1" strokeDasharray="3 3"/>

        {/* hover dot */}
        <circle cx={hx} cy={hy} r="6" fill={T.bg} stroke={T.accent} strokeWidth="2.2"/>

        {/* tooltip — flips left if too close to right edge */}
        {(() => {
          const flip = hx > W - 80;
          const tx = flip ? hx - 70 : hx + 8;
          return (
            <g>
              <rect x={tx} y={padT - 4} width="62" height="32" rx="6"
                fill="rgba(15,18,22,0.92)" stroke={T.borderSoft}/>
              <text x={tx + 8} y={padT + 9} fill={T.text3} fontSize="9" fontFamily={T.font}>
                {data.xLabels[hover] || `#${hover+1}`}
              </text>
              <text x={tx + 8} y={padT + 22} fill={T.text} fontSize="13" fontFamily={T.fontDisplay} fontWeight="700" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {xs[hover].toFixed(1).replace('.', ',')} {data.unit}
              </text>
            </g>
          );
        })()}
      </svg>

      <div style={{ fontSize: 11, color: T.text3, marginTop: 6 }}>Toque ou arraste no gráfico para ver detalhes</div>
    </Card>
  );
}

// ───────────────────────────────────────────────────────────────
// Volume by muscle group — scrollable, units, legend, drill-down
// ───────────────────────────────────────────────────────────────
function VolumeCard({ data, total, deltaPct, onOpen }) {
  const [active, setActive] = React.useState(null);
  const max = Math.max(...data.map(d => d.value));

  const fmt = (v) => v >= 1000 ? `${(v/1000).toFixed(v >= 10000 ? 0 : 1).replace('.', ',')}t` : `${v}kg`;

  const activeItem = data.find(d => d.id === active);

  return (
    <Card>
      <CardHeader
        title="Volume por grupo muscular"
        sub={`Total ${(total/1000).toFixed(1).replace('.', ',')}t · ${deltaPct > 0 ? '+' : ''}${deltaPct}% vs período anterior`}
        right={<IconBtn label="Ver detalhes do volume" onClick={onOpen}>{Icons.expand}</IconBtn>}
      />

      {/* Bars */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 152, paddingLeft: 28, position: 'relative' }}>
        {/* Y axis labels */}
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 22,
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          fontFamily: T.fontMono, fontSize: 9, color: T.text3,
        }}>
          <span>{fmt(max)}</span>
          <span>{fmt(max/2)}</span>
          <span>0</span>
        </div>

        {/* gridlines */}
        <div style={{ position: 'absolute', left: 28, right: 0, top: 0, bottom: 22, pointerEvents: 'none' }}>
          {[0, 0.5, 1].map(p => (
            <div key={p} style={{
              position: 'absolute', left: 0, right: 0, top: `${p * 100}%`,
              borderTop: '1px dashed rgba(255,255,255,0.05)',
            }}/>
          ))}
        </div>

        {data.map(d => {
          const isActive = active === d.id;
          const isDim = active && !isActive;
          const isRest = d.rest;
          const pct = d.value / max;
          return (
            <button key={d.id} onClick={() => setActive(isActive ? null : d.id)} style={{
              all: 'unset', flex: 1, height: '100%', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
              alignItems: 'center', position: 'relative',
              opacity: isDim ? 0.45 : 1,
              transition: 'opacity 160ms ease',
            }}>
              {/* value label above */}
              <div style={{
                fontSize: 11, fontWeight: 600, color: isActive ? T.accent : T.text2,
                fontFamily: T.fontMono, fontVariantNumeric: 'tabular-nums',
                marginBottom: 4,
                visibility: isRest ? 'hidden' : 'visible',
              }}>
                {fmt(d.value)}
              </div>
              {/* bar */}
              <div style={{
                width: '100%', height: `${Math.max(pct * 100, isRest ? 4 : 8)}%`,
                background: isRest
                  ? 'repeating-linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.06) 4px, rgba(255,255,255,0.02) 4px, rgba(255,255,255,0.02) 8px)'
                  : isActive
                    ? `linear-gradient(180deg, ${T.accent} 0%, #0fa5b3 100%)`
                    : `linear-gradient(180deg, ${T.accent} 0%, rgba(30,224,238,0.55) 100%)`,
                borderRadius: '6px 6px 2px 2px',
                border: isRest ? `1px dashed rgba(255,255,255,0.12)` : 'none',
                opacity: isRest ? 0.7 : (isActive ? 1 : 0.85),
                transition: 'all 160ms ease',
                position: 'relative',
              }}>
                {/* delta micro-badge for non-rest */}
                {!isRest && d.delta !== 0 && (
                  <div style={{
                    position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)',
                    fontSize: 9, color: 'rgba(0,0,0,0.7)', fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                    display: pct > 0.4 ? 'block' : 'none',
                  }}>
                    {d.delta > 0 ? '+' : ''}{d.delta}%
                  </div>
                )}
              </div>
              {/* x label */}
              <div style={{
                marginTop: 6,
                fontSize: 10, fontWeight: 600,
                color: isActive ? T.text : T.text2,
                letterSpacing: 0.4, textTransform: 'uppercase',
              }}>{d.label}</div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14, marginTop: 12, paddingTop: 12,
        borderTop: `1px solid ${T.borderSoft}`,
        fontSize: 11, color: T.text2,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: T.accent }}/>
          Treinado
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            width: 10, height: 10, borderRadius: 2,
            background: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.18) 2px, transparent 2px, transparent 4px)',
            border: '1px dashed rgba(255,255,255,0.25)',
          }}/>
          Descanso
        </div>
        <div style={{ marginLeft: 'auto', color: T.text3, fontSize: 10 }}>Toque para detalhes</div>
      </div>

      {/* Drill-down */}
      {activeItem && !activeItem.rest && (
        <div style={{
          marginTop: 12, padding: 12, borderRadius: 12,
          background: T.cardSoft, border: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: T.text2 }}>{activeItem.label}</div>
            <div style={{ fontFamily: T.fontDisplay, fontSize: 18, fontWeight: 700, color: T.text, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
              {fmt(activeItem.value)} <span style={{ fontSize: 12, color: T.text3, fontWeight: 500 }}>volume total</span>
            </div>
          </div>
          <div style={{
            padding: '6px 10px', borderRadius: 8,
            background: activeItem.delta >= 0 ? T.successDim : 'rgba(245,185,69,0.14)',
            color: activeItem.delta >= 0 ? T.success : T.warn,
            fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
          }}>
            {activeItem.delta > 0 ? '+' : ''}{activeItem.delta}%
          </div>
          <button style={{
            all: 'unset', cursor: 'pointer',
            padding: '6px 12px', borderRadius: 8,
            background: T.accent, color: '#06181b',
            fontSize: 12, fontWeight: 700,
          }}>Ver treinos</button>
        </div>
      )}
    </Card>
  );
}

// ───────────────────────────────────────────────────────────────
// Insight (single, rotates by period)
// ───────────────────────────────────────────────────────────────
const INSIGHTS = {
  week: { tag: 'Foco da semana', body: 'Você está 12% acima da média de volume — sinal de sobrecarga progressiva ativa. Mantenha a qualidade do sono para sustentar o ritmo.' },
  month: { tag: 'Destaque do mês', body: 'Aderência de 80% somada à perda consistente de peso indica déficit calórico bem ajustado. Próximo passo: avaliar massa magra.' },
  q: { tag: 'Tendência trimestral', body: 'Queda de 4kg em 90 dias (-1,3kg/mês) está dentro da faixa saudável. Hipertrofia em pernas (+26%) compensa o déficit.' },
  year: { tag: 'Visão anual', body: '88% de aderência em 12 meses é raro — você está no top 5% da comunidade. Considere ciclar para fase de manutenção.' },
};

function InsightBlock({ period }) {
  const ins = INSIGHTS[period];
  return (
    <div style={{
      padding: '14px 16px', borderRadius: 16,
      background: `linear-gradient(135deg, ${T.accentDim} 0%, rgba(30,224,238,0.02) 100%)`,
      border: `1px solid ${T.accentSoft}`,
      display: 'flex', gap: 12, alignItems: 'flex-start',
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
        background: T.accent, color: '#06181b',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{Icons.spark}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.accent, letterSpacing: 0.4, textTransform: 'uppercase' }}>{ins.tag}</div>
        <div style={{ fontSize: 13, color: T.text, marginTop: 4, lineHeight: 1.5, letterSpacing: -0.1 }}>{ins.body}</div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// Tab bar
// ───────────────────────────────────────────────────────────────
function TabBar({ active, onChange }) {
  const tabs = [
    { id: 'train', label: 'Treinar', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4v16M18 4v16M3 8h3M3 16h3M18 8h3M18 16h3M6 12h12"/></svg> },
    { id: 'stats', label: 'Stats', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 20h18M6 20V10M11 20V4M16 20v-7M21 20V8"/></svg> },
    { id: 'social', label: 'Social', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5"/><circle cx="17" cy="9" r="2.5"/><path d="M14 20c0-2.5 2-4 3-4s4 1.5 4 4"/></svg> },
    { id: 'profile', label: 'Perfil', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="9" r="3.5"/><path d="M5 20c0-4 3-6 7-6s7 2 7 6"/></svg> },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 70,
      paddingBottom: 28, paddingTop: 6,
      background: 'linear-gradient(180deg, rgba(10,13,16,0) 0%, rgba(10,13,16,0.92) 30%, rgba(10,13,16,1) 100%)',
      backdropFilter: 'blur(12px)',
    }}>
      <div style={{
        display: 'flex', gap: 4, padding: '8px 16px',
      }}>
        {tabs.map(t => {
          const a = active === t.id;
          return (
            <button key={t.id} onClick={() => onChange(t.id)} style={{
              all: 'unset', flex: 1, cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: '6px 0', borderRadius: 12,
              color: a ? T.accent : T.text2,
            }}>
              <div style={{
                padding: '4px 14px', borderRadius: 10,
                background: a ? T.accentDim : 'transparent',
                border: a ? `1px solid ${T.accentSoft}` : '1px solid transparent',
              }}>{t.icon}</div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.4 }}>{t.label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// Stats screen — assembles everything
// ───────────────────────────────────────────────────────────────
function StatsScreen() {
  const [period, setPeriod] = React.useState('month');
  const [tab, setTab] = React.useState('stats');
  const d = DATA[period];

  return (
    <div style={{
      background: T.bg, color: T.text, fontFamily: T.font, height: '100%',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Sticky-ish top region: title + period selector */}
      <div style={{
        padding: '60px 20px 12px',
        background: T.bg,
        position: 'sticky', top: 0, zIndex: 5,
        borderBottom: `1px solid ${T.borderSoft}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: T.text, letterSpacing: -0.6, fontFamily: T.fontDisplay }}>Sua Evolução</div>
            <div style={{ fontSize: 12, color: T.text2, marginTop: 2 }}>Atualizado hoje, 14:32</div>
          </div>
          <button aria-label="Compartilhar progresso" style={{
            all: 'unset', cursor: 'pointer',
            padding: '8px 12px', borderRadius: 10,
            border: `1px solid ${T.borderSoft}`,
            background: 'rgba(255,255,255,0.04)',
            fontSize: 12, color: T.text2, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M7 8l5-5 5 5M5 21h14"/></svg>
            Compartilhar
          </button>
        </div>
        <PeriodSelector value={period} onChange={setPeriod}/>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '14px 16px 120px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <KpiStrip kpis={d.kpis}/>
          <InsightBlock period={period}/>
          <ConsistencyCard data={d.consistency}/>
          <WeightCard data={d.weight}/>
          <VolumeCard data={d.volume} total={d.volumeTotal} deltaPct={d.volumeDelta}/>
        </div>
      </div>

      <TabBar active={tab} onChange={setTab}/>
    </div>
  );
}

window.StatsScreen = StatsScreen;
