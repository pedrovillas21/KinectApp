export function formatProfileName(fullName: string): string {
  if (!fullName) return '';
  const names = fullName.trim().split(/\s+/);
  return names.slice(0, 2).join(' ');
}

export function formatMemberSince(dateString: string): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';
    const month = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
    const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1);
    return `Membro desde ${capitalizedMonth} ${date.getFullYear()}`;
  } catch {
    return '';
  }
}
