import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { FONT, KINETIC, RADIUS, TYPE } from '../../theme/kinetic';
import Text from './Text';

export interface StatTileProps {
  label: string;
  value: string | number;
  /** Sufixo menor e apagado (ex.: "kg", "/20", " dia"). */
  unit?: string;
  /** Cor do número (ex.: recordes em âmbar). */
  color?: string;
  size?: 'md' | 'sm';
  style?: StyleProp<ViewStyle>;
}

/** Número em Geist Mono com rótulo acima. */
export default function StatTile({ label, value, unit, color = KINETIC.text, size = 'md', style }: StatTileProps) {
  const numberStyle = size === 'md' ? TYPE.stat : TYPE.statSmall;
  return (
    <View style={[styles.tile, size === 'sm' && styles.tileSm, style]} accessible accessibilityLabel={`${label}: ${value}${unit ?? ''}`}>
      <Text variant="micro" color={KINETIC.textSecondary} style={{ fontFamily: FONT.regular }}>
        {label}
      </Text>
      <Text style={numberStyle} color={color}>
        {value}
        {unit ? (
          <Text style={{ fontFamily: FONT.mono, fontSize: 13 }} color={KINETIC.textMuted}>
            {unit}
          </Text>
        ) : null}
      </Text>
    </View>
  );
}

export interface StatRowProps {
  children: React.ReactNode;
  /** Cartão com fundo e divisórias (Início) ou solto (post do feed). */
  card?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Linha de StatTiles em colunas iguais. */
export function StatRow({ children, card = true, style }: StatRowProps) {
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={[styles.row, card && styles.rowCard, style]}>
      {items.map((child, i) => (
        <View key={i} style={[styles.cell, card && i > 0 && styles.cellDivider]}>
          {child}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { padding: 14, gap: 4 },
  tileSm: { padding: 0, gap: 2 },
  row: { flexDirection: 'row' },
  rowCard: { backgroundColor: KINETIC.surface1, borderRadius: RADIUS.xl },
  cell: { flex: 1, minWidth: 0 },
  cellDivider: { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.06)' },
});
