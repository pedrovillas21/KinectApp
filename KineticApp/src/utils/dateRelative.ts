/**
 * Formata uma data ISO em rótulo relativo em PT-BR para a tela de fichas:
 * "Hoje", "Ontem", "Há N dias", "Há N semanas" ou "Nunca" (quando nulo/inválido).
 *
 * O cálculo usa diferença em dias de calendário (zera as horas), de modo que
 * um treino feito ontem à noite e olhado hoje de manhã retorna "Ontem".
 */
export function formatRelativeDays(iso?: string | null): string {
  if (!iso) return 'Nunca';

  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return 'Nunca';

  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

  const diffDays = Math.floor((startOfDay(new Date()) - startOfDay(then)) / 86400000);

  if (diffDays <= 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return `Há ${diffDays} dias`;

  const weeks = Math.floor(diffDays / 7);
  return weeks === 1 ? 'Há 1 semana' : `Há ${weeks} semanas`;
}
