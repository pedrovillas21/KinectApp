/**
 * Sistema de ícones "Kinetic" — line icons (estilo Feather) desenhados em SVG
 * para casar com a identidade do app: traço de 1.8, cantos arredondados,
 * viewBox 24×24 e acento ciano neon (#00E5FF).
 *
 * Substitui os emojis espalhados pela UI por um conjunto coeso e tematizável.
 * Uso: <Icon name="close" size={20} color={KINETIC.textDim} />
 */
import React from 'react';
import Svg, { Circle, Line, Path, Polyline, Rect } from 'react-native-svg';
import { useTextScale } from '../contexts/TextScaleContext';

export type IconName =
  | 'close'
  | 'check'
  | 'send'
  | 'sparkle'
  | 'bar-chart'
  | 'eye'
  | 'eye-off'
  | 'heart'
  | 'heart-filled'
  | 'comment'
  | 'camera'
  | 'image'
  | 'dumbbell'
  | 'lock'
  | 'mail'
  | 'flame'
  | 'moon'
  | 'sun'
  | 'dot'
  | 'bolt'
  | 'key'
  | 'arrow-up'
  | 'arrow-down'
  | 'arrow-right'
  | 'arrow-left'
  | 'home'
  | 'users'
  | 'user'
  | 'user-plus'
  | 'progress'
  | 'bell'
  | 'search'
  | 'plus'
  | 'play'
  | 'trophy'
  | 'share'
  | 'more'
  | 'chevron-right'
  | 'settings'
  | 'link'
  | 'download'
  | 'trash'
  | 'phone'
  | 'shield'
  | 'target'
  | 'calendar'
  | 'ruler'
  | 'globe'
  | 'logout'
  | 'doc'
  | 'ticket'
  | 'pencil';

export interface IconProps {
  name: IconName;
  /** Tamanho em px (largura = altura). Default 22. */
  size?: number;
  /** Cor do traço (ou preenchimento, para ícones sólidos). Default #00E5FF. */
  color?: string;
  /** Espessura do traço para ícones de linha. Default 1.8. */
  strokeWidth?: number;
}

export default function Icon({ name, size: baseSize = 22, color = '#00E5FF', strokeWidth = 1.8 }: IconProps) {
  const size = baseSize * useTextScale().factor;
  const stroke = {
    fill: 'none' as const,
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  const solid = { fill: color, stroke: 'none' as const };

  const body = (() => {
    switch (name) {
      case 'close':
        return <Path d="M6 6l12 12M18 6L6 18" {...stroke} />;

      case 'check':
        return <Polyline points="4 12 9 17 20 6" {...stroke} />;

      case 'send':
        return (
          <>
            <Path d="M22 2L11 13" {...stroke} />
            <Path d="M22 2l-7 20-4-9-9-4 20-7z" {...stroke} />
          </>
        );

      case 'sparkle':
        return <Path d="M12 2l1.9 7.1 7.1 1.9-7.1 1.9L12 22l-1.9-7.1L3 11l7.1-1.9z" {...solid} />;

      case 'bar-chart':
        return <Path d="M3 20h18M6 20V10M11 20V4M16 20v-7M21 20V8" {...stroke} />;

      case 'eye':
        return (
          <>
            <Path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" {...stroke} />
            <Circle cx={12} cy={12} r={3} {...stroke} />
          </>
        );

      case 'eye-off':
        return (
          <>
            <Path
              d="M17.94 17.94A10.07 10.07 0 0112 20C5 20 1 12 1 12a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"
              {...stroke}
            />
            <Line x1={1} y1={1} x2={23} y2={23} {...stroke} />
          </>
        );

      case 'heart':
        return (
          <Path
            d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
            {...stroke}
          />
        );

      case 'heart-filled':
        return (
          <Path
            d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
            {...solid}
          />
        );

      case 'comment':
        return (
          <Path
            d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8z"
            {...stroke}
          />
        );

      case 'camera':
        return (
          <>
            <Path
              d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"
              {...stroke}
            />
            <Circle cx={12} cy={13} r={4} {...stroke} />
          </>
        );

      case 'image':
        return (
          <>
            <Rect x={3} y={3} width={18} height={18} rx={2} ry={2} {...stroke} />
            <Circle cx={8.5} cy={8.5} r={1.5} {...stroke} />
            <Polyline points="21 15 16 10 5 21" {...stroke} />
          </>
        );

      case 'dumbbell':
        return <Path d="M6 4v16M18 4v16M3 8h3M3 16h3M18 8h3M18 16h3M6 12h12" {...stroke} />;

      case 'lock':
        return (
          <>
            <Rect x={5} y={11} width={14} height={10} rx={2} ry={2} {...stroke} />
            <Path d="M8 11V7a4 4 0 018 0v4" {...stroke} />
          </>
        );

      case 'mail':
        return (
          <>
            <Path d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z" {...stroke} />
            <Polyline points="22 6 12 13 2 6" {...stroke} />
          </>
        );

      case 'flame':
        return (
          <Path
            d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 002.5 2.5z"
            {...solid}
          />
        );

      case 'moon':
        return <Path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" {...stroke} />;

      case 'sun':
        return (
          <>
            <Circle cx={12} cy={12} r={5} {...stroke} />
            <Path
              d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
              {...stroke}
            />
          </>
        );

      case 'dot':
        return <Circle cx={12} cy={12} r={4} {...solid} />;

      case 'bolt':
        return <Path d="M13 2L3 14h8l-1 8 11-13h-8z" {...solid} />;

      case 'key':
        return (
          <>
            <Circle cx={7.5} cy={15.5} r={4.5} {...stroke} />
            <Path d="M10.7 12.3L20 3M16 4l3 3M14 6l3 3" {...stroke} />
          </>
        );

      case 'arrow-up':
        return <Path d="M12 19V5M5 12l7-7 7 7" {...stroke} />;

      case 'arrow-down':
        return <Path d="M12 5v14M19 12l-7 7-7-7" {...stroke} />;

      case 'arrow-right':
        return <Path d="M5 12h14M12 5l7 7-7 7" {...stroke} />;

      case 'arrow-left':
        return <Path d="M19 12H5M12 19l-7-7 7-7" {...stroke} />;

      case 'home':
        return <Path d="M3 10.5 12 3l9 7.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z" {...stroke} />;

      case 'users':
        return (
          <Path
            d="M16 20v-1.5a4 4 0 00-4-4H6a4 4 0 00-4 4V20M9 10.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM22 20v-1.5a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
            {...stroke}
          />
        );

      case 'user':
        return <Path d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0" {...stroke} />;

      case 'user-plus':
        return (
          <>
            <Path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M19 8v6M22 11h-6" {...stroke} />
            <Circle cx={9} cy={7} r={4} {...stroke} />
          </>
        );

      case 'progress':
        return <Path d="M4 20V10M10 20V4M16 20v-7M22 20H2" {...stroke} />;

      case 'bell':
        return <Path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 003.4 0" {...stroke} />;

      case 'search':
        return (
          <>
            <Circle cx={11} cy={11} r={7} {...stroke} />
            <Path d="M21 21l-4.35-4.35" {...stroke} />
          </>
        );

      case 'plus':
        return <Path d="M12 5v14M5 12h14" {...stroke} />;

      case 'play':
        return <Path d="M7 4.5v15l12-7.5z" {...solid} />;

      case 'trophy':
        return (
          <Path
            d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0zM17 5h3v2a3 3 0 01-3 3M7 5H4v2a3 3 0 003 3"
            {...stroke}
          />
        );

      case 'share':
        return <Path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" {...stroke} />;

      case 'more':
        return (
          <>
            <Circle cx={5} cy={12} r={1.6} {...solid} />
            <Circle cx={12} cy={12} r={1.6} {...solid} />
            <Circle cx={19} cy={12} r={1.6} {...solid} />
          </>
        );

      case 'chevron-right':
        return <Path d="M9 6l6 6-6 6" {...stroke} />;

      case 'settings':
        return (
          <>
            <Circle cx={12} cy={12} r={3} {...stroke} />
            <Path
              d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"
              {...stroke}
            />
          </>
        );

      case 'link':
        return (
          <Path
            d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"
            {...stroke}
          />
        );

      case 'download':
        return <Path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" {...stroke} />;

      case 'trash':
        return <Path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" {...stroke} />;

      case 'phone':
        return (
          <>
            <Rect x={6} y={2} width={12} height={20} rx={2.5} {...stroke} />
            <Path d="M11 18h2" {...stroke} />
          </>
        );

      case 'shield':
        return <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" {...stroke} />;

      case 'target':
        return (
          <>
            <Circle cx={12} cy={12} r={9} {...stroke} />
            <Circle cx={12} cy={12} r={5} {...stroke} />
            <Circle cx={12} cy={12} r={1.5} {...stroke} />
          </>
        );

      case 'calendar':
        return <Path d="M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2zM16 2v4M8 2v4M3 10h18" {...stroke} />;

      case 'ruler':
        return <Path d="M3 7h18v10H3zM7 7v4M11 7v6M15 7v4M19 7v6" {...stroke} />;

      case 'globe':
        return (
          <>
            <Circle cx={12} cy={12} r={10} {...stroke} />
            <Path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" {...stroke} />
          </>
        );

      case 'logout':
        return <Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" {...stroke} />;

      case 'doc':
        return <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M8 13h8M8 17h5" {...stroke} />;

      case 'ticket':
        return (
          <Path
            d="M3 7a2 2 0 012-2h14a2 2 0 012 2v3a2 2 0 000 4v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a2 2 0 000-4zM13 5v14"
            {...stroke}
          />
        );

      case 'pencil':
        return <Path d="M17 3a2.83 2.83 0 014 4L7.5 20.5 2 22l1.5-5.5zM15 5l4 4" {...stroke} />;
    }
  })();

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {body}
    </Svg>
  );
}
