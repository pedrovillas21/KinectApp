import { useState } from 'react';

interface Props {
  name: string;
  /** URL da foto; com null/erro, cai para as iniciais do nome. */
  avatarUrl?: string | null;
  size?: number;
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
export default function Avatar({ name, avatarUrl, size = 40 }: Props) {
  const [failed, setFailed] = useState(false);

  if (avatarUrl && !failed) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        style={{ width: size, height: size }}
        className="shrink-0 rounded-full object-cover"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.34 }}
      className="flex shrink-0 select-none items-center justify-center rounded-full bg-k-surface2 font-display font-extrabold text-k-primary"
      aria-hidden
    >
      {initialsOf(name)}
    </div>
  );
}
