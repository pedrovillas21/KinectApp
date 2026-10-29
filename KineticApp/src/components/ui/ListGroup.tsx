import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { RADIUS } from '../../theme/kinetic';
import Icon, { IconName } from '../Icon';
import Text from './Text';
import { createStyles, useColors } from '../../theme/ThemeContext';

export interface ListGroupProps {
  /** Rótulo acima do grupo (ex.: "Conta"). */
  title?: string;
  /** Texto pequeno abaixo do grupo. */
  footnote?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Grupo de linhas estilo Ajustes: cartão único com divisórias finas. */
export function ListGroup({ title, footnote, children, style }: ListGroupProps) {
  const styles = useStyles();
  const c = useColors();
  const rows = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={[styles.groupWrap, style]}>
      {title ? (
        <Text variant="captionStrong" color={c.textSecondary} style={styles.groupTitle}>
          {title}
        </Text>
      ) : null}
      <View style={styles.group}>
        {rows.map((row, i) => (
          <View key={i} style={i > 0 ? styles.divider : undefined}>
            {row}
          </View>
        ))}
      </View>
      {footnote ? (
        <Text variant="caption" color={c.textSecondary} style={styles.footnote}>
          {footnote}
        </Text>
      ) : null}
    </View>
  );
}

export interface ListRowProps {
  title: string;
  subtitle?: string;
  icon?: IconName;
  /** Texto à direita (ex.: valor atual). */
  value?: string;
  /** Elemento à direita no lugar do chevron (switch, botão). */
  accessory?: React.ReactNode;
  onPress?: () => void;
  destructive?: boolean;
  /** Mostra o selo "Em breve" e desativa o toque. */
  comingSoon?: boolean;
  /** Linha escolhida numa lista de seleção (anunciado pelo leitor de tela). */
  selected?: boolean;
}

export function ListRow({ title, subtitle, icon, value, accessory, onPress, destructive, comingSoon, selected }: ListRowProps) {
  const styles = useStyles();
  const c = useColors();
  const color = destructive ? c.danger : c.text;
  const pressable = !!onPress && !comingSoon;
  const body = (
    <>
      {icon ? (
        <View style={[styles.iconBox, destructive && { backgroundColor: c.dangerDim }]}>
          <Icon name={icon} size={16} color={destructive ? c.danger : c.textDim} />
        </View>
      ) : null}
      <View style={styles.texts}>
        <Text variant="bodyMedium" color={comingSoon ? c.textSecondary : color} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" color={c.textSecondary} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {comingSoon ? (
        <View style={styles.soon}>
          <Text variant="micro" color={c.textSecondary}>
            Em breve
          </Text>
        </View>
      ) : null}
      {value && !comingSoon ? (
        <Text variant="body" color={c.textSecondary} numberOfLines={1} style={styles.value}>
          {value}
        </Text>
      ) : null}
      {accessory ?? (pressable && !destructive ? <Icon name="chevron-right" size={16} color={c.textMuted} /> : null)}
    </>
  );

  if (!pressable) {
    return <View style={styles.row}>{body}</View>;
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
      accessibilityState={selected === undefined ? undefined : { selected }}
      onPress={onPress}
      android_ripple={{ color: c.subtle }}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {body}
    </Pressable>
  );
}

const useStyles = createStyles((c, s) => ({
  groupWrap: { marginHorizontal: 16, gap: 8 },
  groupTitle: { paddingHorizontal: 4 },
  group: { ...s.card, backgroundColor: c.surface1, borderRadius: RADIUS.xl, overflow: 'hidden' },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
  footnote: { paddingHorizontal: 4 },
  row: { minHeight: 52, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  pressed: { backgroundColor: c.subtle },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.sm,
    backgroundColor: c.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1, gap: 2 },
  value: { maxWidth: '45%' },
  soon: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.pill, backgroundColor: c.divider },
}));
