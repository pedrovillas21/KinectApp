import { motion } from 'motion/react';
import { Plus, RefreshCw, UserPlus, WifiOff } from 'lucide-react';
import { EASE_OUT } from '../motion/primitives';

/** Esqueleto da grade de alunos — mesmo formato dos cards, sem "pulo" ao carregar. */
export function StudentsSkeleton() {
  const nameWidths = ['68%', '54%', '74%', '60%', '70%', '50%'];
  return (
    <div
      role="status"
      aria-label="Carregando alunos"
      className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4"
    >
      {nameWidths.map((w, i) => (
        <div
          key={w + i}
          className="k-skeleton flex flex-col gap-4 rounded-[18px] border border-white/[0.06] bg-k-surface1 p-[18px]"
          style={{ animationDelay: `${i * 120}ms` }}
        >
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 shrink-0 rounded-full bg-k-surface2" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-3 rounded-full bg-k-surface2" style={{ width: w }} />
              <div className="h-2.5 w-[56%] rounded-full bg-[#242424]" />
            </div>
          </div>
          <div className="flex items-center gap-3.5 border-t border-white/[0.05] pt-4">
            <div className="h-[52px] w-[52px] shrink-0 rounded-full border-[5px] border-k-surface2" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-2.5 w-[44%] rounded-full bg-k-surface2" />
              <div className="h-2.5 w-[72%] rounded-full bg-[#242424]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const STEPS = ['Mande o link de convite no WhatsApp', 'O aluno cria a conta e usa o código', 'Acompanhe os treinos dele'];

/** Carteira vazia: ilustração com ondas + CTA + os 3 passos do convite. */
export function StudentsEmpty({ onInvite }: { onInvite: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: EASE_OUT }}
      className="flex flex-col items-center gap-6 rounded-[22px] border-[1.5px] border-dashed border-white/[0.12] px-6 py-16 text-center"
    >
      <div aria-hidden="true" className="relative flex h-[132px] w-[132px] items-center justify-center">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="k-ripple absolute inset-0 rounded-full border-[1.5px] border-k-primary/50"
            style={{ animationDelay: `${i}s` }}
          />
        ))}
        <motion.span
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
          className="relative flex h-16 w-16 items-center justify-center rounded-[20px] border border-k-primary/30 bg-k-primary/[0.12] text-k-primary"
        >
          <UserPlus className="h-7 w-7" />
        </motion.span>
      </div>
      <div className="max-w-[460px]">
        <h3 className="font-display text-[26px] font-extrabold tracking-tight font-stretch-semi-expanded">
          Sua carteira está vazia
        </h3>
        <p className="mt-2.5 text-[15px] leading-relaxed text-k-text-dim">
          Convide seu primeiro aluno pelo e-mail de cadastro dele no app Kinetic. Assim que ele
          aceitar, o perfil e as métricas aparecem aqui.
        </p>
      </div>
      <motion.button
        type="button"
        onClick={onInvite}
        whileTap={{ scale: 0.97 }}
        className="flex h-12 items-center gap-2.5 rounded-[14px] bg-k-primary px-[22px] text-[15px] font-bold text-k-on-primary transition-shadow hover:shadow-[0_0_0_4px_rgba(0,229,255,0.14),0_10px_26px_-10px_rgba(0,229,255,0.8)]"
      >
        <Plus className="h-[18px] w-[18px]" />
        Convidar primeiro aluno
      </motion.button>
      <ol className="mt-1 flex flex-wrap justify-center gap-7">
        {STEPS.map((step, i) => (
          <li key={step} className="flex items-center gap-2.5 text-[13px] text-k-text-dim">
            <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[#242424] font-display text-xs font-extrabold text-k-primary">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
    </motion.div>
  );
}

/** Falha ao carregar a carteira, com nova tentativa. */
export function StudentsError({ onRetry }: { onRetry: () => void }) {
  return (
    <motion.div
      role="alert"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: EASE_OUT }}
      className="mx-auto flex w-full max-w-[560px] flex-col items-center gap-5 rounded-[22px] border border-k-alert/25 bg-k-surface1 p-9 text-center"
    >
      <motion.span
        initial={{ rotate: 0 }}
        animate={{ rotate: [0, -8, 6, -4, 2, 0] }}
        transition={{ duration: 0.9, delay: 0.3 }}
        className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-k-alert/[0.12] text-k-alert"
      >
        <WifiOff className="h-7 w-7" />
      </motion.span>
      <div>
        <h3 className="font-display text-2xl font-extrabold tracking-tight font-stretch-semi-expanded">
          Não foi possível carregar seus alunos
        </h3>
        <p className="mt-2.5 text-[15px] leading-relaxed text-k-text-dim">
          Verifique sua conexão com a internet. Se o problema continuar, o servidor do Kinetic pode
          estar indisponível no momento.
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="group flex h-[46px] items-center gap-2.5 rounded-[13px] border border-white/[0.14] bg-k-surface1 px-5 text-sm font-bold transition-colors hover:border-k-primary/40 hover:bg-k-surface2 active:scale-[0.97]"
      >
        <RefreshCw className="h-[17px] w-[17px] text-k-primary transition-transform duration-500 group-hover:rotate-180" />
        Tentar novamente
      </button>
    </motion.div>
  );
}
