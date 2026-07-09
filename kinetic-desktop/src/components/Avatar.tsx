import type { CSSProperties } from 'react';
import { KINETIC } from '../theme/kinetic';

interface Props {
  name: string;
  /** URL da foto; com null/erro, cai para a inicial do nome. */
  avatarUrl?: string | null;
  size?: number;
}

/** Avatar circular: foto quando existe, senão a inicial do nome sobre ciano dim. */
export default function Avatar({ name, avatarUrl, size = 40 }: Props) {
  const style: CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    flexShrink: 0,
  };

  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} style={{ ...style, objectFit: 'cover' }} />;
  }

  const initial = (name.trim().charAt(0) || '?').toUpperCase();
  return (
    <div
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: KINETIC.primaryDim,
        border: `1px solid ${KINETIC.primarySoft}`,
        color: KINETIC.primary,
        fontWeight: 700,
        fontSize: size * 0.42,
        userSelect: 'none',
      }}
      aria-hidden
    >
      {initial}
    </div>
  );
}
