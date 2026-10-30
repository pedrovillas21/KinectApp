/**
 * Regra do submenu da barra lateral, sem dependências (roda no node --test).
 * O grupo começa aberto quando a rota atual é ele ou está dentro dele.
 */
export function isGroupOpen(groupPath: string, pathname: string): boolean {
  const base = groupPath.replace(/\/+$/, '');
  return pathname === base || pathname.startsWith(`${base}/`);
}
