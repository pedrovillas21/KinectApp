import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useKeyboardOverlap from '../../hooks/useKeyboardOverlap';
import { KINETIC } from '../../theme/kinetic';
import Icon from '../Icon';
import Text from './Text';

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  /** Mostra a seta de voltar no cabeçalho (subtela dentro do sheet); o botão voltar do Android também a usa. */
  onBack?: () => void;
  children: React.ReactNode;
  /**
   * `true` (default): conteúdo rola dentro do sheet e o sheet tem a altura do conteúdo.
   * `false`: o sheet ocupa a tela (menos uma faixa no topo) e o filho gerencia a própria rolagem
   * (ex.: FlatList + campo fixo embaixo).
   */
  scroll?: boolean;
}

/**
 * Painel que sobe de baixo: fundo escurecido, alça, título e fechar. Fica acima do
 * teclado sozinho (mesma medição do Dialog) e respeita a barra de navegação.
 */
export default function BottomSheet({ visible, onClose, title, onBack, children, scroll = true }: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const keyboard = useKeyboardOverlap(visible);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onBack ?? onClose}
    >
      <View
        ref={keyboard.ref}
        style={[styles.overlay, { paddingTop: insets.top + (scroll ? 24 : 56), paddingBottom: keyboard.overlap }]}
      >
        {/* Toque fora fecha; para leitor de tela já existe o botão Fechar do cabeçalho. */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} importantForAccessibility="no" accessibilityElementsHidden />
        <View
          accessibilityViewIsModal
          style={[styles.sheet, !scroll && styles.fill, { paddingBottom: keyboard.open ? 0 : insets.bottom }]}
        >
          <View style={styles.grabber} />
          <View style={styles.header}>
            {onBack ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={onBack} hitSlop={8} style={styles.iconBtn}>
                <Icon name="arrow-left" size={18} color={KINETIC.text} />
              </Pressable>
            ) : null}
            <Text variant="headline" accessibilityRole="header" style={styles.title}>
              {title}
            </Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Fechar" onPress={onClose} hitSlop={8} style={styles.iconBtn}>
              <Icon name="close" size={18} color={KINETIC.textDim} />
            </Pressable>
          </View>
          {scroll ? (
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
              {children}
            </ScrollView>
          ) : (
            <View style={styles.fill}>{children}</View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: KINETIC.scrim },
  sheet: {
    flexShrink: 1,
    backgroundColor: KINETIC.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: KINETIC.hairline,
  },
  fill: { flex: 1 },
  grabber: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, marginTop: 8, backgroundColor: KINETIC.ghostHi },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  title: { flex: 1 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: KINETIC.surface1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { paddingBottom: 24 },
});
