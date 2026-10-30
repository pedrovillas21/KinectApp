import React, { useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Circle } from 'react-native-svg';

import Icon from './Icon';
import { Button, Text } from './ui';
import { useSecondsLeft } from './RestTimer';
import { useActiveWorkout } from '../contexts/ActiveWorkoutContext';
import type { MainStackParamList } from '../navigation/types';
import { formatClock } from '../utils/formatters';
import { FONT, RADIUS } from '../theme/kinetic';
import { createStyles, useColors } from '../theme/ThemeContext';

const SIZE = 56;
const STROKE = 3;
const RADIUS_RING = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS_RING;
const EDGE = 8;
// Altura da BottomTabBar sem o inset (8 de respiro + 48 de toque + folga): o balão nunca desce até ela.
const TAB_BAR = 64;
const CARD_GAP = 8;
const CARD_MS = 6000;
// Menos que isso entre tocar e soltar é toque, não arraste.
const TAP_SLOP = 5;

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

/**
 * Treino minimizado: balão arrastável que gruda na borda, com o anel do descanso. Ao
 * tocar (ou quando o descanso zera fora da tela) abre um cartão com "Voltar ao treino"
 * e "Parar treino". Montado uma vez sobre a pilha do app logado (AppRoutes).
 */
export default function WorkoutBubble() {
  const styles = useStyles();
  const c = useColors();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { workout, screenOpen, restDone, clearRestDone, stop } = useActiveWorkout();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const rest = workout?.rest ?? null;
  const left = useSecondsLeft(rest?.endsAt ?? 0);

  const minY = insets.top + EDGE;
  const maxY = height - TAB_BAR - Math.max(insets.bottom, 10) - EDGE - SIZE;
  // Limites atuais para o PanResponder, criado uma vez só.
  const bounds = useRef({ width, minY, maxY });
  bounds.current = { width, minY, maxY };

  // Começa à esquerda, no terço de baixo da tela.
  const [spot, setSpot] = useState(() => ({ x: EDGE, y: clamp(height * 0.62, minY, maxY) }));
  const spotRef = useRef(spot);
  const pos = useRef(new Animated.ValueXY(spot)).current;

  const [cardOpen, setCardOpen] = useState(false);
  const toggleRef = useRef(() => {});
  toggleRef.current = () => {
    setCardOpen((open) => !open);
    clearRestDone();
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => {
        pos.setValue({ x: spotRef.current.x + g.dx, y: spotRef.current.y + g.dy });
      },
      onPanResponderRelease: (_, g) => {
        if (Math.abs(g.dx) < TAP_SLOP && Math.abs(g.dy) < TAP_SLOP) {
          pos.setValue(spotRef.current);
          toggleRef.current();
          return;
        }
        const b = bounds.current;
        const x = spotRef.current.x + g.dx + SIZE / 2 > b.width / 2 ? b.width - SIZE - EDGE : EDGE;
        const next = { x, y: clamp(spotRef.current.y + g.dy, b.minY, b.maxY) };
        spotRef.current = next;
        setSpot(next);
        Animated.spring(pos, { toValue: next, useNativeDriver: false, friction: 7 }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(pos, { toValue: spotRef.current, useNativeDriver: false }).start();
      },
    }),
  ).current;

  // Descanso zerou fora da tela: o cartão abre sozinho e fecha em alguns segundos.
  useEffect(() => {
    if (!restDone) return;
    setCardOpen(true);
    const timer = setTimeout(() => {
      setCardOpen(false);
      clearRestDone();
    }, CARD_MS);
    return () => clearTimeout(timer);
  }, [restDone, clearRestDone]);

  if (!workout || screenOpen) return null;

  const closeCard = () => {
    setCardOpen(false);
    clearRestDone();
  };
  const backToWorkout = () => {
    closeCard();
    navigation.navigate('ActiveSession');
  };
  const stopWorkout = () => {
    closeCard();
    stop();
  };

  const onRight = spot.x > width / 2;
  const accent = restDone ? c.success : c.primary;
  // Cartão ao lado do balão, do lado de dentro da tela; na metade de baixo cresce para cima.
  const cardSide = onRight ? { right: EDGE + SIZE + CARD_GAP } : { left: EDGE + SIZE + CARD_GAP };
  const cardVertical = spot.y < height / 2 ? { top: spot.y } : { bottom: height - spot.y - SIZE };

  return (
    <>
      <Animated.View
        {...pan.panHandlers}
        style={[styles.bubble, { borderColor: restDone ? c.successSoft : c.primarySoft }, { transform: pos.getTranslateTransform() }]}
        accessible
        accessibilityRole="button"
        accessibilityLabel={rest ? `Treino em andamento. Descanso: faltam ${left} segundos` : 'Treino em andamento'}
        accessibilityHint="Abre as opções para voltar ao treino ou parar"
        onAccessibilityTap={() => toggleRef.current()}
      >
        {rest ? (
          <>
            <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
              <Circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS_RING} stroke={c.primaryDim} strokeWidth={STROKE} fill="none" />
              <Circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS_RING}
                stroke={c.primary}
                strokeWidth={STROKE}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={CIRCUMFERENCE * (1 - left / rest.totalSeconds)}
                transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
              />
            </Svg>
            <Text style={styles.time} color={c.primary}>
              {formatClock(left)}
            </Text>
          </>
        ) : (
          <Icon name={restDone ? 'check' : 'dumbbell'} size={22} color={accent} strokeWidth={2.2} />
        )}
      </Animated.View>

      {cardOpen && (
        <View style={[styles.card, cardSide, cardVertical, { maxWidth: width - SIZE - EDGE * 2 - CARD_GAP * 2 }]}>
          <Text variant="bodyStrong" color={restDone ? c.success : c.text}>
            {restDone ? 'Descanso concluído' : 'Treino em andamento'}
          </Text>
          <Text variant="caption" color={c.textDim} numberOfLines={1}>
            {workout.workoutData.title}
          </Text>
          <View style={styles.actions}>
            <Button label="Voltar ao treino" size="sm" block onPress={backToWorkout} />
            <Button label="Parar treino" size="sm" variant="secondary" block onPress={stopWorkout} />
          </View>
        </View>
      )}
    </>
  );
}

const useStyles = createStyles((c, s) => ({
  bubble: {
    ...s.dialog,
    position: 'absolute',
    top: 0,
    left: 0,
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 1,
    backgroundColor: c.surface1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  time: { fontFamily: FONT.monoSemibold, fontSize: 12.5, lineHeight: 16 },
  card: {
    ...s.dialog,
    position: 'absolute',
    width: 220,
    gap: 2,
    padding: 14,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: c.hairline,
    backgroundColor: c.surface1,
  },
  actions: { gap: 8, marginTop: 10 },
}));
