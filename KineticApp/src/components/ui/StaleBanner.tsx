import React, { useState } from 'react';
import { View } from 'react-native';
import { RADIUS } from '../../theme/kinetic';
import Button from './Button';
import Text from './Text';
import { createStyles, useColors } from '../../theme/ThemeContext';

interface StaleBannerProps {
  /** Mostra o aviso só quando true. */
  visible: boolean;
  onRetry: () => Promise<unknown> | void;
  /** Já há dados na tela (do cache ou de antes): muda o texto. */
  hasData?: boolean;
}

/** Aviso de que a última atualização falhou, com "Tentar de novo". */
export default function StaleBanner({ visible, onRetry, hasData = true }: StaleBannerProps) {
  const styles = useStyles();
  const c = useColors();
  const [retrying, setRetrying] = useState(false);
  if (!visible) return null;

  const retry = async () => {
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <View style={styles.banner} accessibilityLiveRegion="polite">
      <Text variant="caption" color={c.warn} style={styles.text}>
        {hasData ? 'Não foi possível atualizar. Mostrando os últimos dados salvos.' : 'Não foi possível carregar.'}
      </Text>
      <Button label="Tentar de novo" variant="ghost" size="sm" loading={retrying} onPress={retry} />
    </View>
  );
}

const useStyles = createStyles((c) => ({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    marginBottom: 12,
    borderRadius: RADIUS.lg,
    backgroundColor: c.warnDim,
  },
  text: { flex: 1 },
}));
