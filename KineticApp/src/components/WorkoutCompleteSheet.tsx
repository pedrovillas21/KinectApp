import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONT, KINETIC, RADIUS } from '../theme/kinetic';
import type { FinishedWorkout } from '../navigation/types';
import { formatClock, formatThousands } from '../utils/formatters';
import Icon from './Icon';
import { Button, Text } from './ui';

interface Props {
  workout: FinishedWorkout | null;
  onPost: () => void;
  onSkip: () => void;
}

/** Fim do treino já salvo: resumo e convite para postar a foto para os amigos. */
export default function WorkoutCompleteSheet({ workout, onPost, onSkip }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={!!workout} transparent animationType="slide" onRequestClose={onSkip} statusBarTranslucent>
      <View style={styles.scrim}>
        {workout ? (
          <View style={[styles.sheet, { paddingBottom: 20 + insets.bottom }]} accessibilityViewIsModal>
            <View style={styles.handle} />

            <View style={styles.head}>
              <View style={styles.check}>
                <Icon name="check" size={26} color={KINETIC.primary} strokeWidth={2.6} />
              </View>
              <Text variant="display" accessibilityRole="header">
                Treino concluído
              </Text>
              <Text variant="body" color={KINETIC.textDim}>
                {workout.title}
              </Text>
            </View>

            <View style={styles.stats}>
              <Stat label="Tonelagem" value={formatThousands(workout.volumeKg)} unit=" kg" />
              <Stat label="Tempo" value={formatClock(workout.durationSeconds)} />
              <Stat label="Séries" value={String(workout.setsCount)} />
            </View>

            <View style={styles.divider} />

            <View style={styles.ask}>
              <Text variant="headline" style={styles.center}>
                Deseja postar para seus amigos?
              </Text>
              <Text variant="caption" color={KINETIC.textDim} style={styles.center}>
                Tire uma foto e a tonelagem, o tempo e o treino de hoje entram no post.
              </Text>
            </View>

            <Button label="Sim, tirar foto" icon="camera" onPress={onPost} />
            <Pressable accessibilityRole="button" onPress={onSkip} style={styles.skip}>
              <Text variant="bodyMedium" color={KINETIC.textDim}>
                Agora não
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <View style={styles.stat}>
      <Text variant="micro" color={KINETIC.textDim}>
        {label}
      </Text>
      <Text style={styles.statValue}>
        {value}
        {unit ? <Text variant="captionStrong" color={KINETIC.textDim}>{unit}</Text> : null}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, justifyContent: 'flex-end', backgroundColor: KINETIC.scrim },
  sheet: {
    backgroundColor: KINETIC.surface1,
    borderTopLeftRadius: RADIUS.dialog,
    borderTopRightRadius: RADIUS.dialog,
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 18,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: RADIUS.pill, backgroundColor: KINETIC.ghostHi },
  head: { alignItems: 'center', gap: 6 },
  check: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 6,
    backgroundColor: 'rgba(0,229,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, backgroundColor: KINETIC.surface2, borderRadius: RADIUS.lg, padding: 12, gap: 4 },
  statValue: { fontFamily: FONT.monoSemibold, fontSize: 17, lineHeight: 22, color: KINETIC.text },
  divider: { height: 1, backgroundColor: KINETIC.hairline },
  ask: { gap: 4 },
  center: { textAlign: 'center' },
  skip: { height: 48, marginTop: -8, alignItems: 'center', justifyContent: 'center' },
});
