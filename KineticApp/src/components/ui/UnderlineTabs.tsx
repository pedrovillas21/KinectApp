import React from 'react';
import { Pressable, StyleProp, View, ViewStyle } from 'react-native';
import { FONT } from '../../theme/kinetic';
import Text from './Text';
import { createStyles, useColors } from '../../theme/ThemeContext';

export interface UnderlineTab<K extends string> {
  key: K;
  label: string;
}

export interface UnderlineTabsProps<K extends string> {
  tabs: UnderlineTab<K>[];
  value: K;
  onChange: (key: K) => void;
  /** Distribui as abas pela largura toda (perfil) em vez de alinhar à esquerda (feed). */
  stretch?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Abas de texto com sublinhado ciano (Seguindo/Arena/Você, Publicações/Treinos). */
export default function UnderlineTabs<K extends string>({ tabs, value, onChange, stretch, style }: UnderlineTabsProps<K>) {
  const styles = useStyles();
  const c = useColors();
  return (
    <View accessibilityRole="tablist" style={[styles.bar, stretch ? styles.barStretch : styles.barLeft, style]}>
      {tabs.map((tab) => {
        const selected = tab.key === value;
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(tab.key)}
            style={[styles.tab, stretch && styles.tabStretch, { borderBottomColor: selected ? c.primary : 'transparent' }]}
          >
            <Text
              style={{ fontFamily: selected ? FONT.semibold : FONT.medium, fontSize: 14, lineHeight: 20 }}
              color={selected ? c.text : c.textSecondary}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = createStyles((c) => ({
  bar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: c.hairline },
  barLeft: { gap: 24, paddingHorizontal: 20 },
  barStretch: {},
  tab: { height: 44, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 2, marginBottom: -1 },
  tabStretch: { flex: 1 },
}));
