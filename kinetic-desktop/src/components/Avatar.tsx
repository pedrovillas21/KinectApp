import { useState, type CSSProperties } from 'react';
import { KINETIC } from '../theme/kinetic';

interface Props {
  name: string;
  /** URL da foto; com null/erro, cai para as iniciais do nome. */
  avatarUrl?: string | null;
  size?: number;
  /** Cor de um anel externo (ex.: status do aluno). */
  ring?: string;
}

/** Iniciais "Nome Sobrenome" → "NS" (só o primeiro nome → "N"). */
export const initialsOf = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
};

/** Avatar circular: foto quando existe, senão as iniciais em ciano. */
export default function Avatar({ name, avatarUrl, size = 40, ring }: Props) {
  const [failed, setFailed] = useState(false);

  const style: CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    flexShrink: 0,
    boxShadow: ring ? `0 0 0 2px ${KINETIC.bg}, 0 0 0 4px ${ring}` : undefined,
  };

  if (avatarUrl && !failed) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        style={{ ...style, objectFit: 'cover' }}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: KINETIC.surface2,
        color: KINETIC.primary,
        fontFamily: "'Archivo', 'Segoe UI', system-ui, sans-serif",
        fontWeight: 800,
        fontSize: size * 0.34,
        userSelect: 'none',
      }}
      aria-hidden
    >
      {initialsOf(name)}
    </div>
  );
}
