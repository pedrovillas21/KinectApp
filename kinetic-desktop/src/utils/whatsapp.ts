/**
 * Atalho de WhatsApp entre personal e aluno. O backend guarda o celular como
 * DDD + número (11 dígitos, sem o +55).
 */

/** Link wa.me, opcionalmente com a mensagem já preenchida. */
export function whatsappUrl(phone: string, text?: string): string {
  const base = `https://wa.me/55${phone.replace(/\D/g, '')}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/** Máscara progressiva para o input: (11) 98765-4321. */
export function maskCellPhone(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Celular brasileiro: DDD + 9 + 8 dígitos (mesma regra do backend). */
export function isValidCellPhone(value: string): boolean {
  return /^[1-9]{2}9\d{8}$/.test(value.replace(/\D/g, ''));
}
