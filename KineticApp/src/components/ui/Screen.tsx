import React from 'react';
import { RefreshControlProps, ScrollView, StyleProp, View, ViewStyle } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';

import KeyboardAvoider from './KeyboardAvoider';
import { createStyles, useColors } from '../../theme/ThemeContext';

export interface ScreenProps {
  children: React.ReactNode;
  /** Envolve o conteúdo em ScrollView. Default true. */
  scroll?: boolean;
  /**
   * Bordas com safe area. Telas dentro das abas usam o default (a tab bar já
   * reserva o espaço de baixo); telas de pilha passam `['top','bottom']`.
   */
  edges?: Edge[];
  /** Conteúdo fixo acima da rolagem (cabeçalho, abas). */
  header?: React.ReactNode;
  /** Conteúdo fixo abaixo da rolagem (barra de ação). */
  footer?: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  refreshControl?: React.ReactElement<RefreshControlProps>;
}

/** Contêiner padrão de tela: fundo, safe area e rolagem. */
export default function Screen({
  children,
  scroll = true,
  edges = ['top', 'left', 'right'],
  header,
  footer,
  contentStyle,
  refreshControl,
}: ScreenProps) {
  const styles = useStyles();
  return (
    <SafeAreaView style={styles.root} edges={edges}>
      <KeyboardAvoider>
        {header}
        {scroll ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[styles.content, contentStyle]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            refreshControl={refreshControl}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.flex, contentStyle]}>{children}</View>
        )}
        {footer}
      </KeyboardAvoider>
    </SafeAreaView>
  );
}

const useStyles = createStyles((c) => ({
  root: { flex: 1, backgroundColor: c.bg },
  flex: { flex: 1 },
  content: { paddingBottom: 24 },
}));
