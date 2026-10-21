import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KINETIC, RADIUS } from '../../theme/kinetic';
import Icon from '../Icon';
import Text from './Text';
import useKeyboardOverlap from '../../hooks/useKeyboardOverlap';

export interface DialogProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Toque fora / botão voltar fecham. Default true. */
  dismissable?: boolean;
  /** Envolve o corpo em ScrollView (para listas curtas). Default true. */
  scroll?: boolean;
}

const GAP = 16;

/**
 * Balão centralizado. Com o teclado aberto, encosta logo acima dele em vez de
 * ficar coberto (Android e iOS). Calcula a sobreposição real entre o teclado e
 * o modal, então funciona com e sem adjustResize.
 */
export default function Dialog({ visible, onClose, title, children, dismissable = true, scroll = true }: DialogProps) {
  const insets = useSafeAreaInsets();
  const { ref: rootRef, ...keyboard } = useKeyboardOverlap(visible);
  const [rootHeight, setRootHeight] = useState(0);

  const bottomSpace = keyboard.open ? keyboard.overlap + GAP : Math.max(insets.bottom, GAP);
  const maxCardHeight = rootHeight > 0 ? rootHeight - bottomSpace - Math.max(insets.top, GAP) - GAP : undefined;
  const requestClose = dismissable ? onClose : () => {};

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={requestClose}
    >
      <View
        ref={rootRef}
        style={[
          styles.root,
          { justifyContent: keyboard.open ? 'flex-end' : 'center', paddingBottom: bottomSpace, paddingTop: Math.max(insets.top, GAP) },
        ]}
        onLayout={(e) => setRootHeight(e.nativeEvent.layout.height)}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={requestClose}
          accessibilityRole="button"
          accessibilityLabel="Fechar"
          importantForAccessibility="no"
        >
          <View style={styles.scrim} />
        </Pressable>

        <View accessibilityViewIsModal style={[styles.card, maxCardHeight ? { maxHeight: maxCardHeight } : null]}>
          {title || dismissable ? (
            <View style={styles.header}>
              <Text variant="headline" accessibilityRole="header" style={styles.title}>
                {title ?? ''}
              </Text>
              {dismissable ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Fechar"
                  onPress={onClose}
                  hitSlop={8}
                  style={styles.close}
                >
                  <Icon name="close" size={15} color={KINETIC.text} strokeWidth={2.2} />
                </Pressable>
              ) : null}
            </View>
          ) : null}
          {scroll ? (
            <ScrollView
              bounces={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.body}
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          ) : (
            <View style={styles.body}>{children}</View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: GAP },
  scrim: { flex: 1, backgroundColor: KINETIC.scrim },
  card: {
    borderRadius: RADIUS.dialog,
    backgroundColor: KINETIC.surface1,
    borderWidth: 1,
    borderColor: KINETIC.ghost,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 24 },
    elevation: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: { flex: 1 },
  close: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { paddingHorizontal: 16, paddingBottom: 16 },
});
