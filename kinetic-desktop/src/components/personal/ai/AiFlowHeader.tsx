import type { ReactNode } from 'react';
import { ArrowLeft, Check } from 'lucide-react';

const STEPS = ['Pedido', 'Prévia', 'Aprovação'] as const;

interface Props {
  /** Etapa atual: 1 pedido, 2 prévia, 3 aprovação (todas as fichas revisadas). */
  step: 1 | 2 | 3;
  studentFirstName: string;
  onBack: () => void;
  backLabel: string;
  /** Linha abaixo do título (ex.: "nada vai para o app sem a sua aprovação"). */
  note?: ReactNode;
  actions?: ReactNode;
}

/** Cabeçalho fixo do fluxo de fichas com IA: voltar, título e as três etapas. */
export default function AiFlowHeader({ step, studentFirstName, onBack, backLabel, note, actions }: Props) {
  return (
    <div className="sticky top-0 z-20 border-b border-k-ghost bg-k-bg/90 backdrop-blur-[14px]">
      <div className="mx-auto flex w-full max-w-[1120px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 md:px-8 py-3.5">
        <div className="flex min-w-0 items-center gap-3.5">
          <button
            type="button"
            onClick={onBack}
            aria-label={backLabel}
            className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-white/10 bg-k-surface1 text-k-text-dim transition-colors hover:bg-k-surface2 hover:text-k-text"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
          </button>
          <div className="min-w-0">
            <h2 className="truncate font-display text-lg font-extrabold tracking-tight font-stretch-semi-expanded">
              Nova prescrição com IA
            </h2>
            <p className="truncate text-[12.5px] text-k-text-muted">
              Para {studentFirstName}
              {note ? <> · {note}</> : null}
            </p>
          </div>
        </div>

        <ol aria-label="Etapas" className="flex items-center gap-2.5 text-[13px]">
          {STEPS.map((label, i) => {
            const n = i + 1;
            const done = n < step;
            const current = n === step;
            return (
              <li key={label} className="flex items-center gap-2.5" aria-current={current ? 'step' : undefined}>
                {i > 0 && (
                  <span aria-hidden="true" className={`h-px w-6 ${done || current ? 'bg-k-primary/40' : 'bg-white/15'}`} />
                )}
                <span
                  className={`flex items-center gap-2 ${current ? 'font-semibold text-k-text' : done ? 'text-k-text-dim' : 'text-k-text-muted'}`}
                >
                  <span
                    className={`flex h-[22px] w-[22px] items-center justify-center rounded-full font-mono text-[11.5px] ${
                      current
                        ? 'bg-k-primary font-semibold text-k-on-primary'
                        : done
                          ? 'bg-k-primary/[0.14] text-k-primary'
                          : 'border border-white/15'
                    }`}
                  >
                    {done ? <Check className="h-3 w-3" strokeWidth={3} /> : n}
                  </span>
                  <span className={current ? undefined : 'max-sm:hidden'}>{label}</span>
                </span>
              </li>
            );
          })}
        </ol>

        {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
      </div>
    </div>
  );
}

/** Barra de ações fixa no rodapé do fluxo. */
export function AiFlowFooter({ children, summary }: { children: ReactNode; summary: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-20 mt-2 border-t border-k-ghost bg-[#161616]/95 backdrop-blur-[14px]">
      <div className="mx-auto flex w-full max-w-[1120px] flex-wrap items-center justify-between gap-4 px-4 md:px-8 py-4">
        <div className="min-w-0 flex-[1_1_320px] max-sm:text-[13px]">{summary}</div>
        <div className="flex flex-wrap items-center gap-2.5">{children}</div>
      </div>
    </div>
  );
}
