import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BarChart, type barDataItem } from 'react-native-gifted-charts';
import { KINETIC } from '../../theme/kinetic';
import type { WeeklyActivityPointDTO } from '../../types';

interface WeeklyChartProps {
  data: WeeklyActivityPointDTO[];
}

interface ValueLabelProps {
  value: number;
  isToday: boolean;
  isRest: boolean;
}

function ValueLabel({ value, isToday, isRest }: ValueLabelProps) {
  if (isRest) return null;
  return (
    <Text
      style={[
        styles.valueLabel,
        { color: isToday ? KINETIC.primary : KINETIC.textMuted },
      ]}
    >
      {value}
    </Text>
  );
}

export default function WeeklyChart({ data }: WeeklyChartProps) {
  const total = useMemo(
    () => data.reduce((acc, d) => acc + d.minutes, 0),
    [data],
  );

  const max = useMemo(
    () => Math.max(...data.map(d => d.minutes), 1),
    [data],
  );

  const chartData = useMemo<barDataItem[]>(
    () =>
      data.map(point => {
        const isRest = point.minutes === 0;
        const item: barDataItem = {
          value: isRest ? 1 : point.minutes,
          label: point.day,
          labelTextStyle: {
            color: point.isToday ? KINETIC.primary : KINETIC.textMuted,
            fontSize: 10,
            fontWeight: point.isToday ? '700' : '500',
            letterSpacing: 0.2,
          },
          frontColor: point.isToday
            ? KINETIC.primary
            : isRest
              ? 'rgba(255,255,255,0.08)'
              : 'rgba(0,229,255,0.35)',
          gradientColor: point.isToday ? KINETIC.primaryDeep : undefined,
          showGradient: point.isToday,
          topLabelComponent: () => (
            <ValueLabel
              value={point.minutes}
              isToday={point.isToday}
              isRest={isRest}
            />
          ),
          topLabelContainerStyle: styles.topLabelContainer,
        };
        return item;
      }),
    [data],
  );

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>ATIVIDADE DA SEMANA</Text>
        <Text style={styles.unit}>min</Text>
      </View>

      <View style={styles.chartWrap}>
        <BarChart
          data={chartData}
          height={110}
          barWidth={22}
          spacing={14}
          initialSpacing={6}
          endSpacing={6}
          barBorderTopLeftRadius={6}
          barBorderTopRightRadius={6}
          barBorderBottomLeftRadius={2}
          barBorderBottomRightRadius={2}
          maxValue={max + Math.max(max * 0.2, 10)}
          noOfSections={3}
          hideRules={false}
          rulesType="dashed"
          rulesColor="rgba(255,255,255,0.05)"
          hideYAxisText
          yAxisThickness={0}
          xAxisThickness={0}
          disableScroll
          isAnimated
          animationDuration={500}
        />
      </View>

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total semanal</Text>
        <Text style={styles.totalValue}>{total} min</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    backgroundColor: KINETIC.surface1,
    borderRadius: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    color: KINETIC.textDim,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  unit: {
    fontSize: 10,
    color: KINETIC.textMuted,
    fontWeight: '500',
  },
  chartWrap: {
    alignItems: 'flex-start',
    marginLeft: -8,
  },
  topLabelContainer: {
    alignItems: 'center',
    paddingBottom: 2,
  },
  valueLabel: {
    fontSize: 9,
    fontWeight: '700',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: KINETIC.ghost,
  },
  totalLabel: {
    fontSize: 11,
    color: KINETIC.textDim,
  },
  totalValue: {
    fontSize: 11,
    fontWeight: '700',
    color: KINETIC.text,
  },
});
