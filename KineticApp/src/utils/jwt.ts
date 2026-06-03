// Utilitários para inspecionar o JWT no cliente.
// Decodifica apenas o payload (não valida a assinatura — isso é responsabilidade
// do backend). Serve para evitar disparar requests com um token já expirado.

const B64_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// Decoder base64 self-contained (não depende de `atob` global, que varia
// entre engines de JS no React Native).
function base64Decode(input: string): string {
  const str = input.replace(/=+$/, '');
  let output = '';
  for (let bc = 0, bs = 0, i = 0; i < str.length; i++) {
    const idx = B64_CHARS.indexOf(str.charAt(i));
    if (idx === -1) continue;
    bs = bc % 4 ? bs * 64 + idx : idx;
    if (bc++ % 4) {
      output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)));
    }
  }
  return output;
}

function base64UrlDecode(segment: string): string {
  return base64Decode(segment.replace(/-/g, '+').replace(/_/g, '/'));
}

export interface JwtPayload {
  sub?: string;
  exp?: number; // expiração em segundos desde a epoch
  iat?: number;
}

export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(base64UrlDecode(parts[1])) as JwtPayload;
  } catch {
    return null;
  }
}

// Retorna true quando o token não tem `exp`, está ilegível ou já passou do
// horário de expiração. `skewSeconds` adianta a expiração para evitar usar um
// token que vencerá durante a requisição em andamento.
export function isJwtExpired(token: string, skewSeconds = 30): boolean {
  const payload = decodeJwt(token);
  if (!payload || typeof payload.exp !== 'number') return true;
  const nowSeconds = Date.now() / 1000;
  return payload.exp <= nowSeconds + skewSeconds;
}
