import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance, StyleSheet, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ColorScheme, PALETTES, Palette, SHADOWS, Shadows } from './kinetic';

export type ThemePreference = 'light' | 'dark' | 'system';

export const THEME_OPTIONS: { key: ThemePreference; label: string }[] = [
  { key: 'dark', label: 'Escuro' },
  { key: 'light', label: 'Claro' },
  { key: 'system', label: 'Sistema' },
];

const STORAGE_KEY = 'kinetic.theme';
/** Quem nunca escolheu fica no escuro: o app não muda sozinho ao atualizar. */
const DEFAULT_PREFERENCE: ThemePreference = 'dark';

interface ThemeValue {
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => void;
  /** Tema efetivo (preferência resolvida contra o sistema). */
  scheme: ColorScheme;
  colors: Palette;
  shadows: Shadows;
  /** Preferência já lida do aparelho (segura o splash até lá, sem piscar de tema). */
  ready: boolean;
}

const ThemeContext = createContext<ThemeValue>({
  preference: DEFAULT_PREFERENCE,
  setPreference: () => {},
  scheme: 'dark',
  colors: PALETTES.dark,
  shadows: SHADOWS.dark,
  ready: true,
});

// Componentes nativos (teclado, pickers) seguem a escolha; 'unspecified' devolve ao sistema.
const applyNative = (pref: ThemePreference) => Appearance.setColorScheme(pref === 'system' ? 'unspecified' : pref);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(DEFAULT_PREFERENCE);
  const [ready, setReady] = useState(false);
  const systemScheme = useColorScheme();

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        const pref = saved === 'light' || saved === 'dark' || saved === 'system' ? saved : DEFAULT_PREFERENCE;
        setPreferenceState(pref);
        applyNative(pref);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const setPreference = (next: ThemePreference) => {
    setPreferenceState(next);
    applyNative(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  };

  const scheme: ColorScheme = preference === 'system' ? (systemScheme === 'light' ? 'light' : 'dark') : preference;
  return (
    <ThemeContext.Provider
      value={{ preference, setPreference, scheme, colors: PALETTES[scheme], shadows: SHADOWS[scheme], ready }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
export const useColors = () => useContext(ThemeContext).colors;

/**
 * Estilos que dependem do tema. Cria o StyleSheet uma vez por esquema (cache no
 * módulo), então trocar de tema ou re-renderizar não recria nada.
 */
// Mesmo contrato do StyleSheet.create (o tipo interno do RN não é exportado).
type NamedStyles = Parameters<typeof StyleSheet.create>[0];

export function createStyles<T extends NamedStyles>(factory: (c: Palette, s: Shadows) => T & NamedStyles) {
  const cache: Partial<Record<ColorScheme, Readonly<T>>> = {};
  return function useStyles(): Readonly<T> {
    const { scheme } = useContext(ThemeContext);
    return (cache[scheme] ??= StyleSheet.create(factory(PALETTES[scheme], SHADOWS[scheme])));
  };
}
