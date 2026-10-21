import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type TextSize = 'P' | 'M' | 'G';

/** Pequeno = layout original do app; Médio e Grande para quem precisa de letra maior. */
export const TEXT_SIZES: { key: TextSize; label: string; factor: number }[] = [
  { key: 'P', label: 'Pequeno', factor: 1 },
  { key: 'M', label: 'Médio', factor: 1.15 },
  { key: 'G', label: 'Grande', factor: 1.3 },
];

const STORAGE_KEY = 'kinetic.textSize';

interface TextScaleValue {
  size: TextSize;
  factor: number;
  setSize: (size: TextSize) => void;
  /** Preferência já lida do aparelho (segura o splash até lá, sem "pulo" de tamanho). */
  ready: boolean;
}

const TextScaleContext = createContext<TextScaleValue>({ size: 'P', factor: 1, setSize: () => {}, ready: true });

export function TextScaleProvider({ children }: { children: React.ReactNode }) {
  const [size, setSizeState] = useState<TextSize>('P');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === 'P' || saved === 'M' || saved === 'G') setSizeState(saved);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const setSize = (next: TextSize) => {
    setSizeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  };

  const factor = TEXT_SIZES.find((s) => s.key === size)!.factor;
  return <TextScaleContext.Provider value={{ size, factor, setSize, ready }}>{children}</TextScaleContext.Provider>;
}

export const useTextScale = () => useContext(TextScaleContext);
