import { useEffect, useRef, useState } from 'react';
import { Keyboard, KeyboardEvent, LayoutAnimation, Platform, View } from 'react-native';

/**
 * Quanto o teclado cobre a view do `ref` (px). Mede a sobreposição real na janela,
 * então funciona com edge-to-edge (Android 15+, onde a janela não encolhe) e sem ele,
 * dentro ou fora de Modal. Ponha o `ref` numa view de tamanho fixo (flex: 1), não
 * numa que encolhe com o teclado, senão a medida muda a cada reabertura.
 */
export default function useKeyboardOverlap(enabled = true) {
  const ref = useRef<View>(null);
  const [keyboard, setKeyboard] = useState({ open: false, overlap: 0 });

  useEffect(() => {
    if (!enabled) return;
    const ios = Platform.OS === 'ios';
    const animate = () => {
      if (ios) LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    };
    const onShow = (e: KeyboardEvent) => {
      const keyboardTop = e.endCoordinates.screenY;
      ref.current?.measureInWindow((_x, y, _w, h) => {
        animate();
        setKeyboard({ open: true, overlap: Math.max(0, y + h - keyboardTop) });
      });
    };
    const onHide = () => {
      animate();
      setKeyboard({ open: false, overlap: 0 });
    };
    const show = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', onShow);
    const hide = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', onHide);
    return () => {
      show.remove();
      hide.remove();
      setKeyboard({ open: false, overlap: 0 });
    };
  }, [enabled]);

  return { ref, ...keyboard };
}
