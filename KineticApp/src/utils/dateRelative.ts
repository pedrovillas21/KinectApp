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

const MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/**
 * Horário de um post/comentário: "Agora", "Há 12 min", "Há 3 h", "Ontem às 19:42",
 * "Há 4 dias", "16 de jun" (com o ano se não for o atual). Null se a data for inválida.
 */
export function formatPostTime(iso?: string | null): string | null {
  if (!iso) return null;
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return null;

  const now = new Date();
  const minutes = Math.floor((now.getTime() - then.getTime()) / 60000);
  if (minutes < 1) return 'Agora';
  if (minutes < 60) return `Há ${minutes} min`;
  if (minutes < 60 * 6) return `Há ${Math.floor(minutes / 60)} h`;

  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay(now) - startOfDay(then)) / 86400000);
  const time = `${String(then.getHours()).padStart(2, '0')}:${String(then.getMinutes()).padStart(2, '0')}`;
  if (diffDays === 0) return `Hoje às ${time}`;
  if (diffDays === 1) return `Ontem às ${time}`;
  if (diffDays < 7) return `Há ${diffDays} dias`;

  const date = `${then.getDate()} de ${MONTHS_SHORT[then.getMonth()]}`;
  return then.getFullYear() === now.getFullYear() ? date : `${date} de ${then.getFullYear()}`;
}
