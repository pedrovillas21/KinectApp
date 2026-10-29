import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Text } from './ui';
import Icon from './Icon';
import { FONT, RADIUS } from '../theme/kinetic';
import { createStyles, useColors } from '../theme/ThemeContext';

interface Props {
  /** Instante (Date.now()) em que o descanso termina. */
  endsAt: number;
  /** Duração total, para a barra de progresso. */
  totalSeconds: number;
  onDone: () => void;
}

const secondsLeft = (endsAt: number) => Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));

/**
 * Contagem regressiva do descanso entre séries. Conta a partir do horário de fim
 * (não de ticks), então não atrasa com o app em segundo plano.
 */
export default function RestTimer({ endsAt, totalSeconds, onDone }: Props) {
  const styles = useStyles();
  const c = useColors();
  const [left, setLeft] = useState(() => secondsLeft(endsAt));

  useEffect(() => {
    const tick = () => {
      const s = secondsLeft(endsAt);
      setLeft(s);
      if (s === 0) onDone();
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [endsAt, onDone]);

  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');

  return (
    <View
      style={styles.root}
      accessible
      accessibilityRole="timer"
      accessibilityLabel={`Descanso: faltam ${left} segundos`}
      accessibilityLiveRegion="polite"
    >
      <View style={styles.row}>
        <Icon name="clock" size={16} color={c.primary} strokeWidth={2} />
        <Text variant="captionStrong" color={c.textDim} style={styles.flex}>
          Descanso · próxima série libera ao zerar
        </Text>
        <Text style={styles.time} color={c.primary}>
          {mm}:{ss}
        </Text>
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
  flex: { flex: 1 },
  time: { fontFamily: FONT.monoSemibold, fontSize: 22, lineHeight: 28 },
  track: { height: 4, borderRadius: 2, backgroundColor: c.primaryDim, overflow: 'hidden' },
  fill: { height: 4, borderRadius: 2, backgroundColor: c.primary },
}));
