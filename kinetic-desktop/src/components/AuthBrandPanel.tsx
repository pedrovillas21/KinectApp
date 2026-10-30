import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { LucideIcon } from 'lucide-react';
import KineticLogo from './KineticLogo';
import { riseItem, staggerContainer } from './motion/primitives';

export interface BrandHighlight {
  icon: LucideIcon;
  title: string;
  text: string;
}

interface Props {
  /** Muda a chave → o conteúdo faz crossfade (ex.: troca personal/empresa). */
  contentKey: string;
  eyebrow: string;
  title: ReactNode;
  highlights: BrandHighlight[];
}

/** Campo de texto das telas de login/cadastro. */
export const authInputClass =
  'w-full h-11 px-3.5 bg-k-surface1 border border-k-ghost-hi rounded-lg outline-none text-sm text-k-text placeholder:text-k-text-muted transition-[border-color,box-shadow] hover:border-white/25 focus:border-k-primary focus:ring-4 focus:ring-k-primary/15';

/** Metade de marca das telas de autenticação (só aparece em lg+). */
export default function AuthBrandPanel({ contentKey, eyebrow, title, highlights }: Props) {
  return (
    <div className="relative h-full flex flex-col justify-between p-12 xl:p-16 overflow-hidden bg-k-surface1">
      {/* Grade sutil + barras inclinadas que ecoam a logo */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.35] [mask-image:radial-gradient(ellipse_at_top_left,black,transparent_70%)]"
        style={{
          backgroundImage:
            'linear-gradient(var(--color-k-ghost) 1px, transparent 1px), linear-gradient(90deg, var(--color-k-ghost) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <svg
        aria-hidden="true"
        viewBox="0 0 26 20"
        preserveAspectRatio="none"
        className="absolute -right-24 -bottom-16 w-[560px] h-[430px] opacity-[0.07]"
      >
        <path d="M6 0h6L6 20H0z" fill="#00E5FF" />
        <path d="M15 0h6l-6 20H9z" fill="#00E5FF" opacity="0.55" />
        <path d="M24 0h2l-6 20h-2z" fill="#00E5FF" opacity="0.25" />
      </svg>
      <div aria-hidden="true" className="absolute -top-40 -left-40 w-[480px] h-[480px] rounded-full bg-k-primary/10 blur-[140px]" />

      <div className="relative">
        <KineticLogo size={22} />
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={contentKey}
          className="relative max-w-lg"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          exit={{ opacity: 0, y: -12, transition: { duration: 0.2 } }}
        >
          <motion.p variants={riseItem} className="text-xs font-semibold uppercase tracking-[0.18em] text-k-primary">
            {eyebrow}
          </motion.p>
          <motion.h2
            variants={riseItem}
            className="mt-4 font-display font-extrabold uppercase leading-[0.95] text-5xl xl:text-6xl tracking-tight"
          >
            {title}
          </motion.h2>
          <motion.ul variants={riseItem} className="mt-10 flex flex-col gap-5">
            {highlights.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-start gap-4">
                <span className="mt-0.5 grid place-items-center w-9 h-9 shrink-0 rounded-lg bg-k-primary-dim border border-k-primary/20 text-k-primary">
                  <Icon className="w-4 h-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-k-text">{title}</span>
                  <span className="block text-sm text-k-text-dim">{text}</span>
                </span>
              </li>
            ))}
          </motion.ul>
        </motion.div>
      </AnimatePresence>

      <p className="relative text-xs text-k-text-muted">© {new Date().getFullYear()} Kinetic</p>
    </div>
  );
}
