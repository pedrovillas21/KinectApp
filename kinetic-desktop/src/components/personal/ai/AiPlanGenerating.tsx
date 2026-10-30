import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Check, Sparkles } from 'lucide-react';
import AiFlowHeader from './AiFlowHeader';
import { EASE_OUT } from '../../motion/primitives';

interface Props {
  studentFirstName: string;
  planCount: number;
  /** Início da geração (Date.now()): voltar à tela não reinicia as etapas. */
  startedAt: number;
  onCancel: () => void;
  /** Volta para a lista de fichas sem cancelar a geração. */
  onBack: () => void;
}

/**
 * Etapas exibidas enquanto o Gemini responde. O backend não informa progresso, então as
 * primeiras avançam pelo tempo decorrido e a última só termina quando a prévia chega.
 */
const STEPS = [
  { label: 'Lendo o perfil e as restrições', after: 0 },
  { label: 'Interpretando o seu pedido', after: 1500 },
  { label: 'Escolhendo exercícios, séries e cargas', after: 4000 },
  { label: 'Conferindo volume e pontos de atenção', after: 14000 },
];

const SKELETON_ACCENTS = ['bg-k-primary/[0.12]', 'bg-k-warn/[0.12]', 'bg-k-success/[0.12]'];

export default function AiPlanGenerating({ studentFirstName, planCount, startedAt, onCancel, onBack }: Props) {
  const [elapsed, setElapsed] = useState(() => Date.now() - startedAt);

  useEffect(() => {
    const id = window.setInterval(() => setElapsed(Date.now() - startedAt), 500);
    return () => window.clearInterval(id);
  }, [startedAt]);

  // A etapa atual é a última já alcançada pelo tempo; as anteriores aparecem concluídas.
  const current = STEPS.reduce((acc, step, i) => (elapsed >= step.after ? i : acc), 0);

  return (
    <div className="flex flex-col">
      <AiFlowHeader
        step={1}
        studentFirstName={studentFirstName}
        onBack={onBack}
        backLabel="Voltar para as fichas (a geração continua)"
        note="gerando a prévia · pode sair desta tela, avisamos quando ficar pronta"
      />

      <div className="mx-auto flex w-full max-w-[720px] flex-col items-center gap-7 px-4 md:px-8 pb-14 pt-12">
        <div role="status" aria-live="polite" className="flex flex-col items-center gap-4 text-center">
          <div className="relative flex h-[72px] w-[72px] items-center justify-center">
            <span aria-hidden="true" className="k-ripple absolute inset-0 rounded-[24px] border border-k-warn/50" />
            <span className="relative flex h-[72px] w-[72px] items-center justify-center rounded-[22px] bg-k-warn/[0.12] text-k-warn">
              <Sparkles className="k-twinkle h-[30px] w-[30px]" strokeWidth={1.8} />
            </span>
          </div>
          <div>
            <h3 className="font-display text-2xl font-extrabold tracking-tight font-stretch-semi-expanded">
              Montando {planCount === 1 ? 'a ficha' : 'a divisão'} de {studentFirstName}
            </h3>
            <p className="mx-auto mt-2 max-w-[460px] text-sm leading-relaxed text-k-text-dim">
              A IA está montando {planCount === 1 ? '1 ficha' : `${planCount} fichas`} a partir do seu pedido e do
              perfil de {studentFirstName}. Nada é salvo até você aprovar.
            </p>
          </div>
        </div>

        <ol className="w-full rounded-[20px] border border-k-ghost bg-k-surface1 py-2">
          {STEPS.map((step, i) => {
            const done = i < current;
            const active = i === current;
            return (
              <motion.li
                key={step.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: EASE_OUT }}
                className={`flex items-center gap-3.5 px-5 py-3 ${active ? 'bg-k-primary/[0.04]' : ''}`}
              >
                <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center">
                  {done ? (
                    <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-k-success/[0.14] text-k-success">
                      <Check className="h-3.5 w-3.5" strokeWidth={2.6} />
                    </span>
                  ) : active ? (
                    <span
                      aria-hidden="true"
                      className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-k-primary/20 border-t-k-primary motion-reduce:animate-none"
                    />
                  ) : (
                    <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full border-2 border-k-surface3" />
                  )}
                </span>
                <span
                  className={`min-w-0 flex-1 ${done ? 'text-k-text-soft' : active ? 'font-semibold' : 'text-k-text-muted'}`}
                >
                  {step.label}
                </span>
                {active && <span className="text-[12.5px] text-k-primary">em andamento</span>}
              </motion.li>
            );
          })}
        </ol>

        <div aria-hidden="true" className="grid w-full grid-cols-3 gap-3">
          {Array.from({ length: Math.min(planCount, 3) }, (_, i) => (
            <div
              key={i}
              className="k-skeleton flex flex-col gap-3 rounded-2xl border border-white/[0.06] bg-k-surface1 p-4"
              style={{ animationDelay: `${i * 160}ms` }}
            >
              <span className={`h-6 w-[58px] rounded-full ${SKELETON_ACCENTS[i % 3]}`} />
              <span className="h-3 w-[78%] rounded-full bg-k-surface2" />
              <span className="h-2.5 w-[52%] rounded-full bg-[#242424]" />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="h-11 rounded-xl border border-white/10 bg-k-surface1 px-[18px] text-sm font-semibold text-k-text-dim transition-colors hover:bg-k-surface2 hover:text-k-text"
        >
          Cancelar geração
        </button>
      </div>
    </div>
  );
}
