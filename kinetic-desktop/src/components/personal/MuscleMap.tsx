import { useId, useMemo, useRef, useState, type SyntheticEvent } from 'react';
import { AlertCircle } from 'lucide-react';
import { useStudentProtocol } from './StudentProtocol';
import { GROUP_LABEL, weeklyMuscleVolume, type MuscleGroup, type VolumeSource } from './muscleVolume';
import { BACK, FRONT, MIRROR, MUSCLES, SILHOUETTE, VIEW_H, VIEW_W, type MuscleId } from './muscleMapShapes';

/**
 * Rampa sequencial no ciano da marca, escura → clara (tema escuro: perto de zero
 * recua para a superfície). Validada com o dataviz (validateOrdinal, dark, k-surface1):
 * L monótono, ΔL ≥ 0,06, ponta escura 2,14:1, matiz única.
 */
const RAMP = ['#105866', '#067584', '#0094a6', '#00bacd', '#00e5ff'];
/** Limite inferior de cada degrau (séries/sem). Faixas fixas: dá para comparar alunos. */
const BINS = [0, 5, 10, 15, 20];
/** Uma ficha é uma sessão: volumes ~1/3 do semanal, então degraus menores. */
const PLAN_BINS = [0, 2, 4, 6, 8];
const ZERO_FILL = '#222225';
const ZERO_STROKE = '#2e2e32';
const BODY_FILL = '#161618';
const BODY_STROKE = '#262629';
/** Acima disto o músculo ganha o brilho neon. Na ficha, a mesma proporção dos degraus (12/20 ≈ 5/8). */
const GLOW_MIN = 12;
const PLAN_GLOW_MIN = 5;

const fillOf = (v: number, bins = BINS) => (v <= 0 ? ZERO_FILL : RAMP[bins.filter((b) => v >= b).length - 1]);

const nf1 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
const setsLabel = (v: number, unit = '/sem') => `${nf1.format(v)} ${v === 1 ? 'série' : 'séries'}${unit}`;

interface Active {
  group: MuscleGroup;
  /** Região apontada no desenho; ausente quando o destaque vem da lista. */
  muscle?: MuscleId;
  /** Posição do tooltip no container; ausente quando o destaque vem da lista. */
  x?: number;
  y?: number;
}

/** Com `plan`: mapa só daquela ficha (séries de uma sessão), sem o card em volta. */
export default function MuscleMap({
  studentId,
  plans,
  plan,
  bare = false,
  onMuscleClick,
}: {
  studentId: string;
  plans: VolumeSource[];
  plan?: VolumeSource;
  /** Sem o card em volta (quem usa já tem título e moldura). */
  bare?: boolean;
  onMuscleClick?: (muscle: MuscleId) => void;
}) {
  const protocolFrequency = useStudentProtocol(studentId).data?.frequency ?? null;
  const frequency = plan ? null : protocolFrequency;
  const { byGroup, unmatched } = useMemo(
    () => weeklyMuscleVolume(plan ? [plan] : plans, frequency),
    [plan, plans, frequency],
  );
  const bins = plan ? PLAN_BINS : BINS;
  const unit = plan ? '' : '/sem';
  const glowMin = plan ? PLAN_GLOW_MIN : GLOW_MIN;
  // Vários mapas na mesma tela (geral + fichas abertas): o id do filtro não pode repetir.
  const glowId = `glow${useId().replace(/[^\w-]/g, '')}`;
  const [active, setActive] = useState<Active | null>(null);
  // `bare` no celular: só o corpo; os números (e a explicação da conta) abrem sob demanda.
  const [numbersOpen, setNumbersOpen] = useState(false);
  const folded = bare && !numbersOpen ? 'max-md:hidden' : '';
  const boxRef = useRef<HTMLDivElement>(null);

  // Na ficha, só os grupos trabalhados: 11 linhas com zero viram ruído.
  const ranked = (Object.keys(GROUP_LABEL) as MuscleGroup[])
    .filter((g) => !plan || byGroup[g] > 0)
    .sort((a, b) => byGroup[b] - byGroup[a]);
  const loose = Object.entries(unmatched).sort((a, b) => b[1] - a[1]);

  const point = (muscle: MuscleId) => (e: SyntheticEvent<SVGPathElement>) => {
    const box = boxRef.current?.getBoundingClientRect();
    const r = e.currentTarget.getBoundingClientRect();
    if (!box) return;
    // Centraliza acima da região, sem passar da borda do card (celular).
    const x = Math.min(Math.max(r.left + r.width / 2 - box.left, 100), box.width - 100);
    setActive({ group: MUSCLES[muscle].group, muscle, x, y: r.top - box.top });
  };

  const figure = (title: string, regions: [MuscleId, string[]][]) => (
    <figure className="m-0 flex w-1/2 max-w-[150px] flex-col items-center gap-1.5">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="block h-auto w-full overflow-visible"
        role="group"
        aria-label={`Corpo, vista de ${title.toLowerCase()}`}
      >
        <path d={SILHOUETTE} fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth={1} />
        {regions.map(([muscle, shapes]) => {
          const { group, label } = MUSCLES[muscle];
          const v = byGroup[group];
          const on = active?.group === group;
          const show = point(muscle);
          const handlers = {
            onMouseEnter: show,
            onFocus: show,
            onClick: (e: SyntheticEvent<SVGPathElement>) => {
              show(e);
              onMuscleClick?.(muscle);
            },
            onMouseLeave: () => setActive(null),
            onBlur: () => setActive(null),
          };
          const name = label === GROUP_LABEL[group] ? label : `${label} (${GROUP_LABEL[group]})`;
          return (
            // Brilho no <g> de fora; o hover (filtro CSS) fica no de dentro para não apagar o brilho.
            <g key={muscle} data-muscle={muscle} filter={v > glowMin ? `url(#${glowId})` : undefined}>
              <g
                fill={fillOf(v, bins)}
                stroke={on ? '#f5f6f7' : v > 0 ? BODY_FILL : ZERO_STROKE}
                strokeWidth={on ? 1.6 : 0.8}
                className="cursor-pointer outline-none transition-[filter,stroke] duration-150 hover:brightness-125"
              >
                {shapes.flatMap((d, i) => [
                  <path
                    key={`${i}l`}
                    d={d}
                    // Só a primeira forma da região entra no Tab; as demais repetem a mesma informação.
                    tabIndex={i === 0 ? 0 : -1}
                    role="img"
                    aria-label={`${name} · ${setsLabel(v, unit)}`}
                    {...handlers}
                  />,
                  <path key={`${i}r`} d={d} transform={MIRROR} aria-hidden="true" {...handlers} />,
                ])}
              </g>
            </g>
          );
        })}
      </svg>
      <figcaption className="text-[11.5px] text-k-text-muted">{title}</figcaption>
    </figure>
  );

  const content = (
    // Colunas pela largura do contêiner (@container), não da tela: o mapa também vive em coluna estreita.
    <div className="grid gap-5 @xl:grid-cols-[minmax(0,320px)_1fr] @xl:items-center @xl:gap-8">
      <div ref={boxRef} className="relative flex justify-center gap-3" onMouseLeave={() => setActive(null)}>
        <svg width="0" height="0" className="absolute" aria-hidden="true">
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </svg>
        {figure('Frente', FRONT)}
        {figure('Costas', BACK)}
        {active?.x != null && active.y != null && (
          <div
            role="status"
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-xl border border-k-ghost bg-k-surface2 px-3 py-1.5 text-xs text-k-text shadow-lg"
            style={{ left: active.x, top: active.y - 6 }}
          >
            <span className="font-semibold">{active.muscle ? MUSCLES[active.muscle].label : GROUP_LABEL[active.group]}</span>
          {active.muscle && MUSCLES[active.muscle].label !== GROUP_LABEL[active.group] && (
            <span className="text-k-text-dim"> ({GROUP_LABEL[active.group]})</span>
          )}
            <span className="text-k-text-dim"> · {setsLabel(byGroup[active.group], unit)}</span>
          </div>
        )}
      </div>

      <div id={`${glowId}-numbers`} className={`flex min-w-0 flex-col gap-4 ${folded}`}>
        {/* Tabela do mapa: mesma informação sem depender de cor. */}
        <ul className="grid grid-cols-2 gap-x-5 gap-y-0.5 @sm:grid-cols-3 @xl:grid-cols-2 @4xl:grid-cols-3">
          {ranked.map((g) => (
            <li
              key={g}
              onMouseEnter={() => setActive({ group: g })}
              onMouseLeave={() => setActive(null)}
              className={`flex min-w-0 items-center gap-2 rounded-md px-1.5 py-1 text-[13px] ${
                active?.group === g ? 'bg-white/[0.06]' : ''
              }`}
            >
              <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: fillOf(byGroup[g], bins) }} />
              <span className="min-w-0 flex-1 truncate text-k-text-soft">{GROUP_LABEL[g]}</span>
              <span className="font-mono text-[12px] tabular-nums text-k-text">{nf1.format(byGroup[g])}</span>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11.5px] text-k-text-muted">
          <span>{plan ? 'Séries' : 'Séries/sem'}</span>
          {[ZERO_FILL, ...RAMP].map((c, i) => (
            <span key={c} className="flex items-center gap-1">
              <span aria-hidden="true" className="h-2.5 w-4 rounded-[3px]" style={{ background: c }} />
              <span className="tabular-nums">
                {i === 0 ? '0' : i === 1 ? `<${bins[1]}` : i === RAMP.length ? `${bins[i - 1]}+` : `${bins[i - 1]}–${bins[i] - 1}`}
              </span>
            </span>
          ))}
        </div>

        {loose.length > 0 && (
          <p className="flex items-start gap-1.5 text-[12px] leading-relaxed text-k-text-muted">
            <AlertCircle className="mt-[2px] h-3.5 w-3.5 shrink-0 text-k-warn" />
            <span>
              Fora do mapa:{' '}
              {loose.map(([term, v], i) => (
                <span key={term}>
                  {i > 0 && ', '}
                  <span className="text-k-text-soft">{term}</span> ({nf1.format(v)})
                </span>
              ))}
              . Ajuste o grupo muscular desses exercícios para entrarem na conta.
            </span>
          </p>
        )}
      </div>
    </div>
  );

  const caption = (
    <>
      {plan
        ? 'Séries de trabalho desta ficha'
        : `Séries semanais de trabalho das fichas${
            frequency
              ? ` · ${frequency} ${frequency === 1 ? 'treino' : 'treinos'}/sem em rodízio de ${plans.length} ${plans.length === 1 ? 'ficha' : 'fichas'}`
              : ' · cada ficha contada 1x/sem (protocolo sem frequência)'
          }`}
      . Músculo secundário do exercício conta meia série; aquecimento não conta.
    </>
  );

  if (plan || bare)
    return (
      <div className="@container">
        <p className={`mb-3 text-[12.5px] leading-relaxed text-k-text-muted ${folded}`}>{caption}</p>
        {content}
        {bare && (
          <button
            type="button"
            onClick={() => setNumbersOpen((o) => !o)}
            aria-expanded={numbersOpen}
            aria-controls={`${glowId}-numbers`}
            className="mt-3 flex h-11 w-full items-center justify-center rounded-[10px] border border-white/10 text-[13px] font-semibold text-k-text-soft md:hidden"
          >
            {numbersOpen ? 'Ocultar números' : 'Ver séries por grupo'}
          </button>
        )}
      </div>
    );

  return (
    <section
      aria-labelledby="muscle-map-title"
      className="@container rounded-[20px] border border-k-ghost bg-k-surface1 p-5 max-md:rounded-2xl max-md:p-4"
    >
      <h3 id="muscle-map-title" className="font-display text-[17px] font-extrabold font-stretch-semi-expanded">
        Mapa muscular
      </h3>
      <p className="mb-4 mt-1 text-[12.5px] leading-relaxed text-k-text-muted">{caption}</p>

      {content}
    </section>
  );
}
