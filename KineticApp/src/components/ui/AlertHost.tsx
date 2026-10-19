import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { KINETIC } from '../../theme/kinetic';
import Button, { ButtonVariant } from './Button';
import Dialog from './Dialog';
import Text from './Text';

export interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

interface AlertRequest {
  title: string;
  message?: string;
  buttons: AlertButton[];
}

let enqueue: ((request: AlertRequest) => void) | null = null;

/**
 * Substituto do Alert.alert do React Native, com o mesmo formato de chamada, mas
 * desenhado com o Dialog do app. Alertas chamados enquanto outro está aberto
 * (ex.: dentro do onPress) entram na fila e aparecem em seguida.
 */
export function showAlert(title: string, message?: string, buttons?: AlertButton[]): void {
  const request = { title, message, buttons: buttons?.length ? buttons : [{ text: 'OK' }] };
  if (enqueue) enqueue(request);
  else console.warn('AlertHost não montado:', title, message);
}

const VARIANT: Record<NonNullable<AlertButton['style']>, ButtonVariant> = {
  default: 'primary',
  cancel: 'secondary',
  destructive: 'danger',
};

/** Montado uma vez na raiz do app (App.tsx). */
export default function AlertHost() {
  const [queue, setQueue] = useState<AlertRequest[]>([]);

  useEffect(() => {
    enqueue = (request) => setQueue((q) => [...q, request]);
    return () => {
      enqueue = null;
    };
  }, []);

  const current = queue[0];
  if (!current) return null;

  const press = (button?: AlertButton) => {
    setQueue((q) => q.slice(1));
    button?.onPress?.();
  };

  // Tocar fora/voltar equivale ao "cancelar"; com um botão só, a esse botão.
  const dismissButton =
    current.buttons.find((b) => b.style === 'cancel') ?? (current.buttons.length === 1 ? current.buttons[0] : undefined);
  const stacked = current.buttons.length > 2;

  return (
    <Dialog
      visible
      onClose={() => press(dismissButton)}
      title={current.title}
      dismissable={!!dismissButton}
      scroll={false}
    >
      <View style={styles.body}>
        {current.message ? (
          <Text variant="body" color={KINETIC.textDim}>
            {current.message}
          </Text>
        ) : null}
        <View style={stacked ? styles.column : styles.row}>
          {current.buttons.map((button) => (
            <Button
              key={button.text}
              label={button.text}
              variant={VARIANT[button.style ?? 'default']}
              size="md"
              block
              onPress={() => press(button)}
              style={stacked ? undefined : styles.flex}
            />
          ))}
        </View>
      </View>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  body: { gap: 16 },
  row: { flexDirection: 'row', gap: 10 },
  column: { gap: 8 },
  flex: { flex: 1 },
});
