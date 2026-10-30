import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from './ui';
import Icon from './Icon';
import { FONT, RADIUS } from '../theme/kinetic';
import { createStyles, useColors } from '../theme/ThemeContext';

interface Props {
  /** Instante (Date.now()) em que o descanso termina. */
  endsAt: number;
  /** Duração total, para a barra de progresso. */
  totalSeconds: number;
  onSkip: () => void;
  onAddTime: () => void;
}

const secondsLeft = (endsAt: number) => Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));

/**
 * Segundos até `endsAt`. Conta a partir do horário de fim (não de ticks), então não
 * atrasa com o app em segundo plano. Quem encerra o descanso é o ActiveWorkoutProvider.
 */
export function useSecondsLeft(endsAt: number): number {
  const [left, setLeft] = useState(() => secondsLeft(endsAt));
  useEffect(() => {
    const tick = () => setLeft(secondsLeft(endsAt));
    tick();
    if (endsAt <= Date.now()) return;
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [endsAt]);
  return left;
}

/** Contagem regressiva do descanso entre séries. */
export default function RestTimer({ endsAt, totalSeconds, onSkip, onAddTime }: Props) {
  const styles = useStyles();
  const c = useColors();
  const left = useSecondsLeft(endsAt);

  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');

  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <View
          style={styles.timer}
          accessible
          accessibilityRole="timer"
          accessibilityLabel={`Descanso: faltam ${left} segundos`}
          accessibilityLiveRegion="polite"
        >
          <Icon name="clock" size={16} color={c.primary} strokeWidth={2} />
          <Text variant="captionStrong" color={c.textDim}>
            Descanso
          </Text>
          <Text style={styles.time} color={c.primary}>
            {mm}:{ss}
          </Text>
        </View>
        <Pressable style={styles.pill} onPress={onAddTime} accessibilityRole="button" accessibilityLabel="Mais 15 segundos de descanso" hitSlop={6}>
          <Text variant="captionStrong" color={c.text}>+15s</Text>
        </Pressable>
        <Pressable style={styles.pill} onPress={onSkip} accessibilityRole="button" accessibilityLabel="Pular descanso" hitSlop={6}>
          <Text variant="captionStrong" color={c.text}>Pular</Text>
        </Pressable>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${(left / totalSeconds) * 100}%` }]} />
      </View>
    </View>
  );
}

const useStyles = createStyles((c, s) => ({
  root: { ...s.card, gap: 10, padding: 14, marginBottom: 10, borderRadius: RADIUS.lg, backgroundColor: c.surface1, borderWidth: 1, borderColor: c.primarySoft },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timer: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  time: { fontFamily: FONT.monoSemibold, fontSize: 22, lineHeight: 28 },
  pill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.pill, backgroundColor: c.subtle },
  track: { height: 4, borderRadius: 2, backgroundColor: c.primaryDim, overflow: 'hidden' },
  fill: { height: 4, borderRadius: 2, backgroundColor: c.primary },
}));
