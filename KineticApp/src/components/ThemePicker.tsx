import React from 'react';
import { View } from 'react-native';
import { ColorScheme, PALETTES, RADIUS } from '../theme/kinetic';
import { THEME_OPTIONS, ThemePreference, createStyles, useColors, useTheme } from '../theme/ThemeContext';
import { ChoiceGroup, Text } from './ui';

const OPTIONS = THEME_OPTIONS.map((o) => ({ ...o, accessibilityLabel: `Tema ${o.label.toLowerCase()}` }));

/** Miniatura de uma tela no tema dado: fundo, card com duas linhas de texto e o botão ciano. */
function MiniScreen({ scheme }: { scheme: ColorScheme }) {
  const styles = useStyles();
  const p = PALETTES[scheme];
  return (
    <View style={[styles.mini, { backgroundColor: p.bg }]}>
      <View style={[styles.miniCard, { backgroundColor: p.surface1, borderColor: p.hairline }]}>
        <View style={[styles.bar, { width: '75%', backgroundColor: p.text }]} />
        <View style={[styles.bar, { width: '50%', backgroundColor: p.textMuted }]} />
      </View>
      <View style={[styles.pill, { backgroundColor: p.primaryFill }]} />
    </View>
  );
}

function Preview({ pref }: { pref: ThemePreference }) {
  const styles = useStyles();
  if (pref !== 'system') return <View style={styles.frame}><MiniScreen scheme={pref} /></View>;
  // Sistema: metade escura, metade clara.
  return (
    <View style={[styles.frame, styles.split]}>
      <View style={styles.half}><MiniScreen scheme="dark" /></View>
      <View style={[styles.half, styles.halfRight]}><MiniScreen scheme="light" /></View>
    </View>
  );
}

/**
 * Escolha Escuro/Claro/Sistema com miniatura de cada tema. Aplica na hora em
 * todo o app, inclusive na tela em volta.
 */
export default function ThemePicker() {
  const styles = useStyles();
  const c = useColors();
  const { preference, setPreference, scheme } = useTheme();

  return (
    <View style={styles.root}>
      <ChoiceGroup
        options={OPTIONS}
        value={preference}
        onChange={setPreference}
        renderPreview={(key) => <Preview pref={key} />}
      />
      {preference === 'system' && (
        <Text variant="caption" color={c.textSecondary} style={styles.note}>
          Segue o tema do aparelho — agora {scheme === 'dark' ? 'escuro' : 'claro'}.
        </Text>
      )}
    </View>
  );
}

const MINI_W = 56;

const useStyles = createStyles((c) => ({
  root: { gap: 12 },
  frame: { width: MINI_W, height: 72, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: c.border, overflow: 'hidden' },
  split: { flexDirection: 'row' },
  // Cada metade mostra a sua parte da mesma miniatura de largura cheia.
  half: { width: MINI_W / 2 - 1, overflow: 'hidden' },
  halfRight: { alignItems: 'flex-end' },
  mini: { width: MINI_W - 2, flex: 1, padding: 6, gap: 6 },
  miniCard: { padding: 5, gap: 4, borderRadius: 5, borderWidth: 1 },
  bar: { height: 4, borderRadius: 2 },
  pill: { width: '55%', height: 8, borderRadius: 4 },
  note: { paddingHorizontal: 4 },
}));
