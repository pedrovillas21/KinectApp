import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from './ui/scaled';
import { LinearGradient } from 'expo-linear-gradient';
import { MetricDeltaDTO, PlanEvolutionResponseDTO, StatsInsightDTO } from '../types';
import {
  formatNumberPtBR,
  formatTotalVolume,
} from '../utils/statsUtils';
import Icon from './Icon';
import { createStyles, useColors } from '../theme/ThemeContext';

// ─── Delta chip ───────────────────────────────────────────────────────────────
function DeltaChip({ delta, good, suffix = '' }: { delta: number; good: boolean; suffix?: string }) {
  const c = useColors();
  const color = good ? c.success : c.warn;
  const bg = good ? c.successDim : c.warnDim;
  return (
    <View style={[chipS.chip, { backgroundColor: bg }]}>
      <Icon name={delta >= 0 ? 'arrow-up' : 'arrow-down'} size={12} color={color} strokeWidth={2.6} />
      <Text style={[chipS.text, { color }]}>
        {formatNumberPtBR(Math.abs(delta), 1)}{suffix}
      </Text>
    </View>
  );
}

const chipS = StyleSheet.create({
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, alignSelf: 'flex-start',
  },
  text: { fontSize: 12, fontWeight: '600' },
});

// ─── Linha de métrica ─────────────────────────────────────────────────────────
function MetricRow({
  label,
  metric,
  formatValue,
  suffix = '',
}: {
  label: string;
  metric: MetricDeltaDTO;
  formatValue: (v: number) => string;
  suffix?: string;
}) {
  const rowS = useRowS();
  return (
    <View style={rowS.row}>
      <Text style={rowS.label}>{label}</Text>
      <View style={rowS.values}>
        <Text style={rowS.prev}>{formatValue(metric.previous)}</Text>
        <Text style={rowS.arrow}> → </Text>
        <Text style={rowS.current}>{formatValue(metric.current)}{suffix}</Text>
      </View>
      <DeltaChip delta={metric.delta} good={metric.good} suffix={suffix} />
    </View>
  );
}

const useRowS = createStyles((c) => ({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  label: { fontSize: 13, color: c.textDim, fontWeight: '500', flex: 1 },
  values: { flexDirection: 'row', alignItems: 'baseline', flex: 1, justifyContent: 'center' },
  prev: { fontSize: 13, color: c.textMuted },
  arrow: { fontSize: 12, color: c.textMuted },
  current: { fontSize: 13, fontWeight: '600', color: c.text },
}));

// ─── Insight embutido ─────────────────────────────────────────────────────────
function EmbeddedInsight({ insight }: { insight: StatsInsightDTO }) {
  const insightS = useInsightS();
  const c = useColors();
  return (
    <LinearGradient
      colors={[c.primaryDim, 'rgba(30,224,238,0.02)']}
      start={[0, 0]}
      end={[1, 1]}
      style={insightS.box}
    >
      <View style={insightS.iconBadge}>
        <Icon name="sparkle" size={14} color={c.onPrimary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={insightS.tag}>{insight.tag.toUpperCase()}</Text>
        <Text style={insightS.body}>{insight.body}</Text>
      </View>
    </LinearGradient>
  );
}

const useInsightS = createStyles((c) => ({
  box: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    padding: 12, borderRadius: 12, borderWidth: 1, borderColor: c.primarySoft,
    marginTop: 12,
  },
  iconBadge: {
    width: 24, height: 24, borderRadius: 6,
    backgroundColor: c.primaryFill, alignItems: 'center', justifyContent: 'center',
  },
  tag: { fontSize: 10, fontWeight: '700', color: c.primary, letterSpacing: 0.4 },
  body: { fontSize: 12, color: c.text, marginTop: 3, lineHeight: 18 },
}));

// ─── Estado vazio ─────────────────────────────────────────────────────────────
function EmptyState({ message }: { message: string }) {
  const emptyS = useEmptyS();
  return (
    <View style={emptyS.wrap}>
      <Text style={emptyS.text}>{message}</Text>
    </View>
  );
}

const useEmptyS = createStyles((c) => ({
  wrap: { paddingVertical: 20, alignItems: 'center' },
  text: { fontSize: 13, color: c.textMuted, textAlign: 'center', lineHeight: 19 },
}));

// ─── Card principal ───────────────────────────────────────────────────────────
interface PlanEvolutionCardProps {
  data: PlanEvolutionResponseDTO;
}

export default function PlanEvolutionCard({ data }: PlanEvolutionCardProps) {
  const cardS = useCardS();
  return (
    <View style={cardS.card}>
      <View style={cardS.header}>
        <Text style={cardS.title}>Evolução do Plano</Text>
        <Text style={cardS.subtitle}>Ciclo anterior → ciclo atual</Text>
      </View>

      {!data.available ? (
        <EmptyState message="Regenere seu treino para começar a comparar ciclos." />
      ) : !data.currentCycleStarted ? (
        <EmptyState message="Ciclo recém-iniciado — registre treinos para ver a comparação." />
      ) : (
        <>
          <View style={cardS.divider} />

          {data.weight && (
            <MetricRow
              label="Peso"
              metric={data.weight}
              formatValue={(v) => `${formatNumberPtBR(v, 1)} kg`}
            />
          )}
          {data.volume && (
            <MetricRow
              label="Volume"
              metric={data.volume}
              formatValue={(v) => formatTotalVolume(v)}
            />
          )}
          {data.adherence && (
            <MetricRow
              label="Aderência"
              metric={data.adherence}
              formatValue={(v) => `${Math.round(v)}`}
              suffix="%"
            />
          )}

          <View style={cardS.sessions}>
            <Text style={cardS.sessionText}>
              Sessões:{' '}
              <Text style={cardS.sessionBold}>{data.previousCompletedSessions}</Text>
              <Text style={cardS.sessionDim}> ant.</Text>
              {'  '}
              <Text style={cardS.sessionBold}>{data.currentCompletedSessions}</Text>
              <Text style={cardS.sessionDim}> atual</Text>
            </Text>
          </View>

          {data.insight && <EmbeddedInsight insight={data.insight} />}
        </>
      )}
    </View>
  );
}

const useCardS = createStyles((c, s) => ({
  card: {
    ...s.card,
    backgroundColor: c.surface1,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: c.divider,
  },
  header: { marginBottom: 4 },
  title: { fontSize: 16, fontWeight: '600', color: c.text, letterSpacing: -0.2 },
  subtitle: { fontSize: 12, color: c.textDim, marginTop: 3 },
  divider: { height: 1, backgroundColor: c.divider, marginVertical: 10 },
  sessions: { marginTop: 8 },
  sessionText: { fontSize: 12, color: c.textDim },
  sessionBold: { fontWeight: '700', color: c.text },
  sessionDim: { color: c.textMuted },
}));
