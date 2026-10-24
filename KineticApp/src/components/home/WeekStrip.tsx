import React from 'react';
import { StyleSheet, View } from 'react-native';
import { FONT, KINETIC, RADIUS } from '../../theme/kinetic';
import type { HomeWeekDayDTO } from '../../types';
import { parseLocalDate, weekdayLetter } from '../../utils/formatters';
import { Text } from '../ui';

const WEEKDAY_NAMES = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

/** Faixa dos 7 dias da semana: hoje com anel ciano, ponto nos dias treinados. */
export default function WeekStrip({ days }: { days: HomeWeekDayDTO[] }) {
  return (
    <View style={styles.card} accessibilityLabel="Semana">
      {days.map((day) => {
        const date = parseLocalDate(day.date);
        const past = !day.today && date.getTime() < Date.now();
        const numberColor = day.today ? KINETIC.primary : past ? KINETIC.textMuted : KINETIC.text;
        const label = `${WEEKDAY_NAMES[date.getDay()]} ${date.getDate()}${day.today ? ', hoje' : ''}${
          day.trained ? ', treinou' : ''
        }`;
        return (
          <View key={day.date} style={styles.day} accessible accessibilityLabel={label}>
            <Text variant="micro" color={KINETIC.textMuted}>
              {weekdayLetter(date)}
            </Text>
            <View style={[styles.circle, day.today && styles.circleToday]}>
              <Text style={styles.number} color={numberColor}>
                {date.getDate()}
              </Text>
            </View>
            <View style={[styles.dot, day.trained && styles.dotOn]} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: RADIUS.xl,
    backgroundColor: KINETIC.surface1,
    flexDirection: 'row',
  },
  day: { flex: 1, alignItems: 'center', gap: 6 },
  circle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleToday: { borderColor: KINETIC.primary },
  number: { fontFamily: FONT.monoMedium, fontSize: 13, lineHeight: 16 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  dotOn: { backgroundColor: KINETIC.primary },
});
