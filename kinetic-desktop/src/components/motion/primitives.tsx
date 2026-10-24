import { useEffect, type ReactNode } from 'react';
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type Variants,
} from 'motion/react';

/**
 * Primitivos de animação do painel (Motion). Todas as entradas usam a mesma
 * curva "expo out" para o painel ter um ritmo único; o MotionConfig em
 * main.tsx já desliga transformações quando o SO pede movimento reduzido.
 */

export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Mola usada em indicadores que deslizam (abas, filtros). */
export const SPRING_PILL = { type: 'spring', stiffness: 420, damping: 32 } as const;

/** Container que escalona a entrada dos filhos — par do `riseItem`. */
export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

/** Filho que sobe e aparece dentro de um `staggerContainer`. */
export const riseItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_OUT } },
};

interface CountUpProps {
  value: number;
  format: (v: number) => string;
  duration?: number;
  className?: string;
}

/** Número que conta do valor anterior até o novo (0 → valor na montagem). */
export function CountUp({ value, format, duration = 1.1, className }: CountUpProps) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(reduce ? value : 0);
  const text = useTransform(mv, (v) => format(v));

  useEffect(() => {
    if (reduce) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, { duration, ease: EASE_OUT });
    return () => controls.stop();
  }, [mv, value, duration, reduce]);

  return <motion.span className={className}>{text}</motion.span>;
}

interface ProgressRingProps {
  /** 0–100; valores fora disso são limitados. */
  value: number;
  size: number;
  stroke: number;
  /** Hex (#rrggbb) — o brilho opcional usa o mesmo tom com alpha. */
  color?: string;
  glow?: boolean;
  delay?: number;
  children?: ReactNode;
}

/** Anel de progresso que se preenche (e troca de cor) com animação. */
export function ProgressRing({
  value,
  size,
  stroke,
  color = '#00e5ff',
  glow = false,
  delay = 0,
  children,
}: ProgressRingProps) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference, stroke: color }}
          animate={{ strokeDashoffset: circumference * (1 - pct / 100), stroke: color }}
          transition={{ duration: 1.2, ease: EASE_OUT, delay }}
          style={{
            // Com 0% a ponta arredondada viraria um "pingo" solto.
            opacity: pct > 0 ? 1 : 0,
            filter: glow ? `drop-shadow(0 0 6px ${color}73)` : undefined,
          }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">{children}</div>
      )}
    </div>
  );
}
