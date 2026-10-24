/**
 * Link de convite do personal: o código vai na URL da página pública
 * (/convite/:code), que explica ao aluno como baixar o app e usar o código.
 */

/** "ABCDE23456" → "ABCDE-23456" (só para leitura; o backend ignora o hífen). */
export function formatInviteCode(code: string): string {
  const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return clean.length > 5 ? `${clean.slice(0, 5)}-${clean.slice(5)}` : clean;
}

export function inviteUrl(code: string): string {
  return `${window.location.origin}/convite/${formatInviteCode(code)}`;
}

/** Mensagem pronta para o personal mandar ao aluno. */
export function inviteMessage(code: string, trainerFirstName?: string): string {
  const who = trainerFirstName ? `Aqui é ${trainerFirstName}! ` : '';
  return (
    `${who}Vou acompanhar seus treinos pelo app Kinetic. ` +
    `Abra o link para baixar o app e se conectar comigo: ${inviteUrl(code)}\n\n` +
    `Seu código de convite: ${formatInviteCode(code)}`
  );
}

/** wa.me sem número: o WhatsApp abre a lista de contatos para o personal escolher. */
export function whatsappShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/** "vence em 3 dias" / "vence hoje" / "vencido". */
export function expiryLabel(expiresAt: string, now = new Date()): string {
  const ms = new Date(expiresAt).getTime() - now.getTime();
  if (ms <= 0) return 'Vencido';
  const days = Math.floor(ms / 86_400_000);
  if (days === 0) return 'Vence hoje';
  return `Vence em ${days} ${days === 1 ? 'dia' : 'dias'}`;
}
