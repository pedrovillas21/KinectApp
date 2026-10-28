import { useEffect } from 'react';
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

