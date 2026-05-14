import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-gifted-charts';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import {LinearGradient} from 'expo-linear-gradient';
import EvolutionModal from '../components/EvolutionModal';
import api from '../services/api';
import {
  CommunityComparisonDTO,
  StatsInsightDTO,
  StatsPeriodId,
  StatsSummaryResponseDTO,
  VolumeByMuscleGroupDTO,
  VolumeSummaryDTO,
  WeightPointDTO,
  WeightSummaryDTO,
} from '../types';
import {
  STATS_PERIODS,
  formatNumberPtBR,
  formatSignedNumberPtBR,
  formatSignedPercent,
  formatTotalVolume,
  formatVolumeKg,
  periodDescription,
} from '../utils/statsUtils';

// ─── Design tokens (espelham `T` do mock HTML/JSX) ─────────────────────────
const T = {
  bg: '#0a0d10',
  card: '#15191d',
  cardSoft: '#1b2025',
  border: 'rgba(255,255,255,0.06)',
  borderSoft: 'rgba(255,255,255,0.04)',
  text: '#f5f6f7',
  text2: 'rgba(245,246,247,0.62)',
  text3: 'rgba(245,246,247,0.34)',
  accent: '#1ee0ee',
  accentDim: 'rgba(30,224,238,0.10)',
  accentSoft: 'rgba(30,224,238,0.16)',
  success: '#4ade80',
  successDim: 'rgba(74,222,128,0.14)',
  warn: '#f5b945',
  warnDim: 'rgba(245,185,69,0.14)',
} as const;

const SCREEN_W = Dimensions.get('window').width;
const CONTENT_PAD = 16;

// ─── Atoms ────────────────────────────────────────────────────────────────
interface CardHeaderProps {
  title: string;
  subtitle?: string;
}
function CardHeader({ title, subtitle }: CardHeaderProps) {
  return (
    <View style={styles.cardHeader}>
      <Text style={styles.cardTitle}>{title}</Text>
      {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

interface DeltaChipProps {
  value: number;
  good: boolean;
  suffix?: string;
}
function DeltaChip({ value, good, suffix }: DeltaChipProps) {
  const positive = value >= 0;
  const color = good ? T.success : T.warn;
  const bg = good ? T.successDim : T.warnDim;
  return (
    <View style={[chipStyles.chip, { backgroundColor: bg }]}>
      <Text style={[chipStyles.text, { color }]}>
        {positive ? '↑' : '↓'} {formatNumberPtBR(Math.abs(value), 1)}
        {suffix ?? ''}
      </Text>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});

// ─── Period selector ──────────────────────────────────────────────────────
interface PeriodSelectorProps {
  value: StatsPeriodId;
  onChange: (id: StatsPeriodId) => void;
}
function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <View style={selectorStyles.row}>
      {STATS_PERIODS.map((p) => {
        const active = p.id === value;
        return (
          <TouchableOpacity
            key={p.id}
            onPress={() => onChange(p.id)}
            activeOpacity={0.8}
            style={[
              selectorStyles.pill,
              active ? selectorStyles.pillActive : null,
            ]}
          >
            <Text
              style={[
                selectorStyles.label,
                { color: active ? T.bg : T.text2 },
              ]}
            >
              {p.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const selectorStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: T.borderSoft,
  },
  pill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
  },
  pillActive: {
    backgroundColor: T.text,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
});

// ─── KPI strip ────────────────────────────────────────────────────────────
interface KpiData {
  label: string;
  value: string;
  unit: string;
  delta: string;
  good: boolean;
}
interface KpiStripProps {
  kpis: ReadonlyArray<KpiData>;
}
function KpiStrip({ kpis }: KpiStripProps) {
  return (
    <View style={kpiStyles.row}>
      {kpis.map((k) => (
        <View key={k.label} style={kpiStyles.cell}>
          <Text style={kpiStyles.label}>{k.label.toUpperCase()}</Text>
          <View style={kpiStyles.valueRow}>
            <Text style={kpiStyles.value}>{k.value}</Text>
            {k.unit ? <Text style={kpiStyles.unit}>{k.unit}</Text> : null}
          </View>
          <Text
            style={[
              kpiStyles.delta,
              { color: k.good ? T.success : T.warn },
            ]}
          >
            {k.delta}
          </Text>
        </View>
      ))}
    </View>
  );
}

const kpiStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  cell: {
    flex: 1,
    backgroundColor: T.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.border,
    padding: 12,
  },
  label: {
    fontSize: 11,
    color: T.text2,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 6,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    color: T.text,
    letterSpacing: -0.6,
  },
  unit: {
    fontSize: 11,
    color: T.text3,
    fontWeight: '500',
    marginLeft: 3,
  },
  delta: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '600',
  },
});

// ─── Insight block (Destaque do Mês) ──────────────────────────────────────
interface InsightBlockProps {
  insight: StatsInsightDTO;
}
function InsightBlock({ insight }: InsightBlockProps) {
  return (
    <LinearGradient
      colors={[T.accentDim, 'rgba(30,224,238,0.02)']}
      start={[0, 0]}
      end={[1, 1]}
      style={insightStyles.box}
    >
      <View style={insightStyles.iconBadge}>
        <Text style={insightStyles.iconText}>✦</Text>
      </View>
      <View style={insightStyles.body}>
        <Text style={insightStyles.tag}>{insight.tag.toUpperCase()}</Text>
        <Text style={insightStyles.text}>{insight.body}</Text>
      </View>
    </LinearGradient>
  );
}

const insightStyles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.accentSoft,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: T.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: '#06181b',
    fontSize: 16,
    fontWeight: '900',
  },
  body: {
    flex: 1,
  },
  tag: {
    fontSize: 11,
    fontWeight: '700',
    color: T.accent,
    letterSpacing: 0.4,
  },
  text: {
    fontSize: 13,
    color: T.text,
    marginTop: 4,
    lineHeight: 19,
  },
});

// ─── Consistency card (ring + community comparison) ───────────────────────
interface ConsistencyCardProps {
  completed: number;
  target: number;
  efficiencyPercentage: number;
  community: CommunityComparisonDTO;
}
function ConsistencyCard({
  completed,
  target,
  efficiencyPercentage,
  community,
}: ConsistencyCardProps) {
  const ringSize = 132;
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const safeTarget = target > 0 ? target : 1;
  const pct = Math.max(0, Math.min(1, completed / safeTarget));
  const dash = circumference * pct;

  const aboveCommunity = community.isAbove;
  const arrow = aboveCommunity ? '↑' : '↓';
  const cmpColor = aboveCommunity ? T.success : T.warn;
  const cmpLabel = aboveCommunity ? 'acima da média' : 'abaixo da média';

  return (
    <View style={styles.card}>
      <CardHeader
        title="Frequência"
        subtitle={`Treinos concluídos · ${completed} de ${target}`}
      />

      <View style={consistencyStyles.row}>
        <View style={{ width: ringSize, height: ringSize }}>
          <Svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`}>
            <Defs>
              <SvgLinearGradient id="ringGradient" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor={T.accent} />
                <Stop offset="100%" stopColor="#0fa5b3" />
              </SvgLinearGradient>
            </Defs>
            <Circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={10}
            />
            <Circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              fill="none"
              stroke="url(#ringGradient)"
              strokeWidth={10}
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference - dash}`}
              transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
            />
          </Svg>
          <View style={consistencyStyles.ringCenter}>
            <Text style={consistencyStyles.ringValue}>
              {completed}
              <Text style={consistencyStyles.ringValueDim}>/{target}</Text>
            </Text>
            <Text style={consistencyStyles.ringLabel}>TREINOS</Text>
          </View>
        </View>

        <View style={consistencyStyles.side}>
          <Text style={consistencyStyles.sideLabel}>ADERÊNCIA</Text>
          <Text style={consistencyStyles.sideValue}>
            {efficiencyPercentage}
            <Text style={consistencyStyles.sideUnit}>%</Text>
          </Text>
          <Text style={consistencyStyles.sideHint}>
            <Text style={{ color: cmpColor, fontWeight: '600' }}>
              {arrow} {cmpLabel}
            </Text>{' '}
            da sua comunidade ({community.averagePercentage}%).
          </Text>
        </View>
      </View>
    </View>
  );
}

const consistencyStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  ringCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringValue: {
    fontSize: 30,
    fontWeight: '700',
    color: T.text,
    letterSpacing: -1,
  },
  ringValueDim: {
    color: T.text3,
    fontWeight: '500',
  },
  ringLabel: {
    fontSize: 10,
    color: T.text2,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  side: {
    flex: 1,
    minWidth: 0,
  },
  sideLabel: {
    fontSize: 11,
    color: T.text2,
    letterSpacing: 0.3,
    fontWeight: '500',
  },
  sideValue: {
    fontSize: 28,
    fontWeight: '700',
    color: T.text,
    letterSpacing: -0.8,
    marginTop: 2,
  },
  sideUnit: {
    fontSize: 18,
    color: T.text3,
  },
  sideHint: {
    fontSize: 12,
    color: T.text2,
    marginTop: 8,
    lineHeight: 18,
  },
});

// ─── Weight card ──────────────────────────────────────────────────────────
interface WeightCardProps {
  weight: WeightSummaryDTO;
  period: StatsPeriodId;
}
function WeightCard({ weight, period }: WeightCardProps) {
  const chartWidth = SCREEN_W - CONTENT_PAD * 2 - 36; // -padding interno do card
  const points = weight.history;

  const data = points.map((p: WeightPointDTO) => ({
    value: p.weight,
    label: p.date.length >= 10 ? p.date.substring(8, 10) : p.date,
  }));

  const trendDown = weight.delta < 0;
  const goodTrend = trendDown; // perda de peso = favorável neste contexto

  return (
    <View style={styles.card}>
      <CardHeader title="Peso Corporal" subtitle={periodDescription(period)} />

      <View style={weightStyles.headlineRow}>
        <Text style={weightStyles.headline}>
          {formatNumberPtBR(weight.current, 1)}
        </Text>
        <Text style={weightStyles.headlineUnit}>{weight.unit}</Text>
        <View style={{ marginLeft: 8 }}>
          <DeltaChip value={weight.delta} good={goodTrend} suffix={weight.unit} />
        </View>
      </View>

      {data.length >= 2 ? (
        <LineChart
          data={data}
          width={chartWidth}
          height={160}
          areaChart
          color={T.accent}
          thickness={2.2}
          startFillColor={T.accent}
          endFillColor={T.card}
          startOpacity={0.32}
          endOpacity={0}
          dataPointsColor={T.accent}
          dataPointsRadius={4}
          xAxisColor="transparent"
          yAxisColor="transparent"
          yAxisTextStyle={{ color: T.text3, fontSize: 10 }}
          xAxisLabelTextStyle={{ color: T.text3, fontSize: 10 }}
          rulesColor="rgba(255,255,255,0.05)"
          rulesType="dashed"
          isAnimated
          curved
          initialSpacing={8}
        />
      ) : (
        <Text style={styles.emptyText}>
          Registre seu peso para visualizar a evolução.
        </Text>
      )}
    </View>
  );
}

const weightStyles = StyleSheet.create({
  headlineRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  headline: {
    fontSize: 36,
    fontWeight: '700',
    color: T.text,
    letterSpacing: -1.2,
  },
  headlineUnit: {
    fontSize: 14,
    color: T.text3,
    fontWeight: '500',
    marginLeft: 6,
  },
});

// ─── Volume card (custom bars + drill-down) ───────────────────────────────
interface VolumeCardProps {
  volume: VolumeSummaryDTO;
}
function VolumeCard({ volume }: VolumeCardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const groups = volume.byMuscleGroup;
  const maxValue = Math.max(...groups.map((g) => g.volume), 1);
  const activeItem = activeId
    ? groups.find((g) => g.muscleGroup === activeId) ?? null
    : null;

  const totalDeltaSign = volume.deltaPercentage > 0 ? '+' : '';

  return (
    <View style={styles.card}>
      <CardHeader
        title="Volume por grupo muscular"
        subtitle={`Total ${formatTotalVolume(volume.total)} · ${totalDeltaSign}${volume.deltaPercentage}% vs período anterior`}
      />

      {/* Bars */}
      <View style={volumeStyles.chartRow}>
        <View style={volumeStyles.yAxis}>
          <Text style={volumeStyles.yLabel}>{formatVolumeKg(maxValue)}</Text>
          <Text style={volumeStyles.yLabel}>{formatVolumeKg(maxValue / 2)}</Text>
          <Text style={volumeStyles.yLabel}>0</Text>
        </View>

        <View style={volumeStyles.barsArea}>
          {groups.map((g: VolumeByMuscleGroupDTO) => {
            const isActive = activeId === g.muscleGroup;
            const isDim = activeId !== null && !isActive;
            const isRest = g.isRest;
            const heightPct = isRest ? 4 : Math.max((g.volume / maxValue) * 100, 8);

            return (
              <TouchableOpacity
                key={g.muscleGroup}
                activeOpacity={0.85}
                onPress={() => setActiveId(isActive ? null : g.muscleGroup)}
                style={[volumeStyles.barCol, { opacity: isDim ? 0.45 : 1 }]}
              >
                {!isRest ? (
                  <Text
                    style={[
                      volumeStyles.barValue,
                      { color: isActive ? T.accent : T.text2 },
                    ]}
                  >
                    {formatVolumeKg(g.volume)}
                  </Text>
                ) : (
                  <Text style={volumeStyles.barValue}> </Text>
                )}

                <View style={[volumeStyles.barTrack]}>
                  {isRest ? (
                    <View style={volumeStyles.restBar} />
                  ) : (
                    <LinearGradient
                      colors={[T.accent, isActive ? '#0fa5b3' : 'rgba(30,224,238,0.55)']}
                      start={[0, 0]}
                      end={[0, 1]}
                      style={[
                        volumeStyles.bar,
                        { height: `${heightPct}%`, opacity: isActive ? 1 : 0.85 },
                      ]}
                    />
                  )}
                </View>

                <Text
                  style={[
                    volumeStyles.barLabel,
                    { color: isActive ? T.text : T.text2 },
                  ]}
                  numberOfLines={1}
                >
                  {g.muscleGroup.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Legend */}
      <View style={volumeStyles.legend}>
        <View style={volumeStyles.legendItem}>
          <View style={[volumeStyles.swatch, { backgroundColor: T.accent }]} />
          <Text style={volumeStyles.legendText}>Treinado</Text>
        </View>
        <View style={volumeStyles.legendItem}>
          <View
            style={[
              volumeStyles.swatch,
              {
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: 'rgba(255,255,255,0.25)',
                backgroundColor: 'rgba(255,255,255,0.06)',
              },
            ]}
          />
          <Text style={volumeStyles.legendText}>Descanso</Text>
        </View>
        <Text style={volumeStyles.legendHint}>Toque para detalhes</Text>
      </View>

      {/* Drill-down */}
      {activeItem && !activeItem.isRest ? (
        <View style={volumeStyles.drilldown}>
          <View style={{ flex: 1 }}>
            <Text style={volumeStyles.drillLabel}>{activeItem.muscleGroup}</Text>
            <Text style={volumeStyles.drillValue}>
              {formatVolumeKg(activeItem.volume)}{' '}
              <Text style={volumeStyles.drillValueDim}>volume total</Text>
            </Text>
          </View>
          <View
            style={[
              volumeStyles.drillBadge,
              {
                backgroundColor:
                  activeItem.deltaPercentage >= 0 ? T.successDim : T.warnDim,
              },
            ]}
          >
            <Text
              style={[
                volumeStyles.drillBadgeText,
                {
                  color: activeItem.deltaPercentage >= 0 ? T.success : T.warn,
                },
              ]}
            >
              {formatSignedPercent(activeItem.deltaPercentage)}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const volumeStyles = StyleSheet.create({
  chartRow: {
    flexDirection: 'row',
    height: 172,
  },
  yAxis: {
    width: 32,
    justifyContent: 'space-between',
    paddingBottom: 22,
  },
  yLabel: {
    fontSize: 9,
    color: T.text3,
  },
  barsArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  barCol: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barValue: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  barTrack: {
    width: '100%',
    flex: 1,
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  restBar: {
    width: '100%',
    height: '8%',
    borderRadius: 4,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    opacity: 0.7,
  },
  barLabel: {
    marginTop: 6,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: T.borderSoft,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 11,
    color: T.text2,
  },
  legendHint: {
    marginLeft: 'auto',
    color: T.text3,
    fontSize: 10,
  },
  drilldown: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: T.cardSoft,
    borderWidth: 1,
    borderColor: T.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  drillLabel: {
    fontSize: 12,
    color: T.text2,
    textTransform: 'capitalize',
  },
  drillValue: {
    fontSize: 18,
    fontWeight: '700',
    color: T.text,
    marginTop: 2,
  },
  drillValueDim: {
    fontSize: 12,
    color: T.text3,
    fontWeight: '500',
  },
  drillBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  drillBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

// ─── Screen ───────────────────────────────────────────────────────────────
export default function StatsScreen() {
  const [period, setPeriod] = useState<StatsPeriodId>('month');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [stats, setStats] = useState<StatsSummaryResponseDTO | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  // O modal de atualização de peso só pode aparecer uma vez por sessão.
  // Sem isso, qualquer refetch (troca de período / pull-to-refresh) reabriria
  // o modal enquanto o backend continuar retornando needsWeightUpdate: true.
  const weightModalDismissedRef = useRef<boolean>(false);

  const fetchStats = useCallback(
    async (selected: StatsPeriodId): Promise<void> => {
      try {
        const response = await api.get<StatsSummaryResponseDTO>('/stats/summary', {
          params: { period: selected },
        });
        const data = response.data;
        setStats(data);
        setFetchError(null);
        if (data.needsWeightUpdate && !weightModalDismissedRef.current) {
          setModalVisible(true);
        }
      } catch (error) {
        console.error('Error fetching stats', error);
        setFetchError('Não foi possível atualizar suas estatísticas. Verifique sua conexão e tente novamente.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  const closeWeightModal = useCallback(() => {
    weightModalDismissedRef.current = true;
    setModalVisible(false);
  }, []);

  const onWeightModalSuccess = useCallback(() => {
    weightModalDismissedRef.current = true;
    setModalVisible(false);
    fetchStats(period);
  }, [fetchStats, period]);

  useEffect(() => {
    setLoading(true);
    fetchStats(period);
  }, [period, fetchStats]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStats(period);
  }, [period, fetchStats]);

  const kpis = useMemo<ReadonlyArray<KpiData>>(() => {
    if (!stats) return [];
    const { weight, volume, completedSessions, targetSessions, efficiencyPercentage } = stats;
    return [
      {
        label: 'Peso',
        value: formatNumberPtBR(weight.current, 1),
        unit: weight.unit,
        delta: `${formatSignedNumberPtBR(weight.delta, 1)} ${weight.unit}`,
        good: weight.delta <= 0,
      },
      {
        label: 'Treinos',
        value: String(completedSessions),
        unit: `/${targetSessions}`,
        delta: `${efficiencyPercentage}%`,
        good: efficiencyPercentage >= 60,
      },
      {
        label: 'Volume',
        value: formatTotalVolume(volume.total),
        unit: '',
        delta: formatSignedPercent(volume.deltaPercentage),
        good: volume.deltaPercentage >= 0,
      },
    ];
  }, [stats]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={T.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!stats) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.zeroContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.accent} />
          }
        >
          <View style={styles.zeroCard}>
            <Text style={styles.zeroIcon}>📊</Text>
            <Text style={styles.zeroTitle}>Sua Evolução</Text>
            <Text style={styles.zeroDesc}>
              Não foi possível carregar suas estatísticas. Puxe para baixo para tentar novamente.
            </Text>
          </View>
        </ScrollView>
        <EvolutionModal
          visible={modalVisible}
          onClose={closeWeightModal}
          onSuccess={onWeightModalSuccess}
        />
      </SafeAreaView>
    );
  }

  const hasAnyVolume = stats.volume.byMuscleGroup.length > 0;
  const hasAnyWeight = stats.weight.history.length > 0;

  if (!hasAnyVolume && !hasAnyWeight && stats.efficiencyPercentage === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.zeroContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.accent} />
          }
        >
          <View style={styles.zeroCard}>
            <Text style={styles.zeroIcon}>📊</Text>
            <Text style={styles.zeroTitle}>Sua Evolução</Text>
            <Text style={styles.zeroDesc}>
              Seu primeiro insight aparecerá logo após seu primeiro treino finalizado!
            </Text>
          </View>
        </ScrollView>
        <EvolutionModal
          visible={modalVisible}
          onClose={closeWeightModal}
          onSuccess={onWeightModalSuccess}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.screenTitle}>Sua Evolução</Text>
            <Text style={styles.screenSubtitle}>Os números não mentem.</Text>
          </View>
        </View>
        <PeriodSelector value={period} onChange={setPeriod} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.accent} />
        }
      >
        <View style={{ gap: 14 }}>
          {fetchError ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{fetchError}</Text>
            </View>
          ) : null}
          <KpiStrip kpis={kpis} />
          <InsightBlock insight={stats.insight} />
          <ConsistencyCard
            completed={stats.completedSessions}
            target={stats.targetSessions}
            efficiencyPercentage={stats.efficiencyPercentage}
            community={stats.community}
          />
          <WeightCard weight={stats.weight} period={period} />
          <VolumeCard volume={stats.volume} />
        </View>
      </ScrollView>

      <EvolutionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={() => fetchStats(period)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.bg,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    paddingHorizontal: CONTENT_PAD,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: T.borderSoft,
    gap: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: T.text,
    letterSpacing: -0.6,
  },
  screenSubtitle: {
    fontSize: 12,
    color: T.text2,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: CONTENT_PAD,
    paddingTop: 14,
    paddingBottom: 48,
  },
  card: {
    backgroundColor: T.card,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: T.border,
  },
  cardHeader: {
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: T.text,
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: T.text2,
    marginTop: 3,
  },
  emptyText: {
    color: T.text3,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 24,
  },
  zeroContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  zeroCard: {
    alignItems: 'center',
    backgroundColor: T.card,
    borderRadius: 16,
    padding: 32,
  },
  zeroIcon: {
    fontSize: 52,
    marginBottom: 20,
  },
  zeroTitle: {
    color: T.text,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 12,
  },
  zeroDesc: {
    color: T.text2,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorBanner: {
    backgroundColor: T.warnDim,
    borderWidth: 1,
    borderColor: 'rgba(245,185,69,0.45)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorBannerText: {
    color: T.warn,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
});
