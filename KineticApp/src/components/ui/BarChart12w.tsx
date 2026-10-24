import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';
import { KINETIC } from '../../theme/kinetic';
import Text from './Text';

export interface BarSeries {
  values: number[];
  color: string;
  /** Cor da última barra (semana atual). Default = color. */
  lastColor?: string;
}

export interface BarChart12wProps {
  /** Uma série (perfil) ou duas lado a lado (comparar progresso). */
  series: BarSeries[];
  /** Rótulos distribuídos abaixo do eixo (ex.: meses). */
  labels?: string[];
  height?: number;
  /** Descrição para leitor de tela. */
  accessibilityLabel: string;
}

const GAP = 6;
const PAIR_GAP = 2;
const RADIUS = 3;

/** Barra com só os cantos de cima arredondados. */
const barPath = (x: number, y: number, w: number, h: number) => {
  const r = Math.min(RADIUS, w / 2, h);
  const bottom = y + h;
  return `M${x},${bottom} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${bottom} Z`;
};

/** Barras semanais (12 semanas) em SVG. */
export default function BarChart12w({ series, labels, height = 110, accessibilityLabel }: BarChart12wProps) {
  const [width, setWidth] = useState(0);
  const count = Math.max(0, ...series.map((s) => s.values.length));
  const max = Math.max(1, ...series.flatMap((s) => s.values));

  const slot = count > 0 ? (width - GAP * (count - 1)) / count : 0;
  const barW = series.length > 1 ? (slot - PAIR_GAP * (series.length - 1)) / series.length : slot;

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      <View style={{ height }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 ? (
          <Svg width={width} height={height}>
            {series.map((s, si) =>
              s.values.map((v, i) => {
                const h = v > 0 ? Math.max(2, (v / max) * (height - 1)) : 0;
                if (h === 0) return null;
                const x = i * (slot + GAP) + si * (barW + PAIR_GAP);
                const isLast = i === s.values.length - 1;
                return (
                  <Path
                    key={`${si}-${i}`}
                    d={barPath(x, height - 1 - h, barW, h)}
                    fill={isLast && s.lastColor ? s.lastColor : s.color}
                  />
                );
              }),
            )}
            <Line x1={0} y1={height - 0.5} x2={width} y2={height - 0.5} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
          </Svg>
        ) : null}
      </View>
      {labels && labels.length > 0 ? (
        <View style={styles.labels}>
          {labels.map((l, i) => (
            <Text key={`${l}-${i}`} variant="mono" color={KINETIC.textMuted} style={styles.label}>
              {l}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  label: { fontSize: 10, lineHeight: 12 },
});
