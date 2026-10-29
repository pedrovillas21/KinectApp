import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PlanEvolutionCard from '../components/PlanEvolutionCard';
import Icon from '../components/Icon';
import { ActivityIndicator, Dimensions, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { Text } from '../components/ui/scaled';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LineChart } from 'react-native-gifted-charts';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import EvolutionModal from '../components/EvolutionModal';
import { SegmentedControl, StaleBanner } from '../components/ui';
import useFocusResource from '../hooks/useFocusResource';
import api from '../services/api';
import {
  CommunityComparisonDTO,
  PhysicalAssessmentDTO,
  PlanEvolutionResponseDTO,
  StatsInsightDTO,
  StatsPeriodId,
  StatsActivityDTO,
  StatsSummaryResponseDTO,
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
import { FONT, Palette, RADIUS } from '../theme/kinetic';
import { formatKg, formatMinutes, formatShortDate, parseLocalDate, weekdayLetter } from '../utils/formatters';
import { createStyles, useColors } from '../theme/ThemeContext';

const SCREEN_W = Dimensions.get('window').width;
const CONTENT_PAD = 16;

// ─── Atoms ────────────────────────────────────────────────────────────────
function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  const styles = useStyles();
  return (
    <View style={styles.cardHeader}>
      <View style={styles.flex}>
        <Text style={styles.cardTitle}>{title}</Text>
        {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}

// ─── Consistência: treinos do período + anel de aderência ───────────────────
interface ConsistencyCardProps {
  activity: StatsActivityDTO;
  completed: number;
  target: number;
  efficiencyPercentage: number;
  community: CommunityComparisonDTO;
}
function ConsistencyCard({ activity, completed, target, efficiencyPercentage, community }: ConsistencyCardProps) {
  const consistencyStyles = useConsistencyStyles();
  const styles = useStyles();
  const c = useColors();
  const size = 84;
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * Math.max(0, Math.min(1, efficiencyPercentage / 100));
  const cmpColor = community.isAbove ? c.success : c.warn;

  return (
    <View style={styles.card}>
      <View style={consistencyStyles.row}>
        <View style={styles.flex}>
          <Text style={styles.eyebrow}>Consistência</Text>
          <Text style={consistencyStyles.value}>
            {completed}
            <Text style={consistencyStyles.valueDim}> / {target}</Text>
          </Text>
          <Text style={styles.cardSubtitle}>treinos concluídos</Text>
        </View>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} accessibilityLabel={`Aderência de ${efficiencyPercentage}%`}>
          <Circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={c.ghost} strokeWidth={8} />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={c.primary}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference - dash}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
          <SvgText
            x={size / 2}
            y={size / 2 + 5}
            textAnchor="middle"
            fill={c.text}
            fontFamily={FONT.monoSemibold}
            fontSize={16}
          >
            {`${efficiencyPercentage}%`}
          </SvgText>
        </Svg>
      </View>
      <ActivityBars activity={activity} />
      <View style={consistencyStyles.footer}>
        {community.averagePercentage == null ? (
          <Text style={styles.cardSubtitle}>Adicione amigos para comparar sua consistência</Text>
        ) : (
          <>
            <Icon name={community.isAbove ? 'arrow-up' : 'arrow-down'} size={14} color={cmpColor} strokeWidth={2.2} />
            <Text style={styles.cardSubtitle}>
              <Text style={{ color: cmpColor, fontFamily: FONT.semibold }}>
                {community.isAbove ? 'Acima' : 'Abaixo'} da média
              </Text>{' '}
              dos seus amigos ({community.averagePercentage}%)
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

const useConsistencyStyles = createStyles((c) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  value: { fontFamily: FONT.monoSemibold, fontSize: 40, lineHeight: 46, letterSpacing: -1.5, color: c.text, marginTop: 4 },
  valueDim: { fontSize: 18, letterSpacing: 0, color: c.textSecondary },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: c.hairline,
  },
}));

// ─── Barras de atividade (dias, semanas ou meses do período) ────────────────
const BARS_H = 56;
const CAPTION = { day: 'Treinos por dia', week: 'Treinos por semana', month: 'Treinos por mês' } as const;
const GOAL_UNIT = { day: '', week: '/sem', month: '/mês' } as const;

function bucketLabel(activity: StatsActivityDTO, index: number): string {
  const { granularity, buckets } = activity;
  const iso = buckets[index].start;
  if (granularity === 'day') return weekdayLetter(parseLocalDate(iso));
  if (granularity === 'month') return formatShortDate(iso).slice(3);
  // Muitas semanas (3M): só a primeira e a última levam data, senão os rótulos se atropelam.
  if (buckets.length <= 6) return `Sem ${index + 1}`;
  return index === 0 || index === buckets.length - 1 ? formatShortDate(iso) : '';
}

function ActivityBars({ activity }: { activity: StatsActivityDTO }) {
  const barStyles = useBarStyles();
  const c = useColors();
  const { buckets, target } = activity;
  if (buckets.length === 0) return null;
  // Folga acima da meta para a linha não encostar no topo e parecer um divisor.
  const max = Math.max(target ? target * 1.25 : 0, ...buckets.map((b) => b.sessions), 1);
  const showCounts = buckets.length <= 7;
  const last = buckets.length - 1;

  // Três faixas separadas (números, barras, rótulos): a linha da meta mede só a faixa das barras.
  return (
    <View style={barStyles.wrap}>
      <View style={barStyles.caption}>
        <Text style={barStyles.label}>{CAPTION[activity.granularity]}</Text>
        {target ? <Text style={barStyles.label}>meta {target}{GOAL_UNIT[activity.granularity]}</Text> : null}
      </View>
      {showCounts ? (
        <View style={barStyles.row}>
          {buckets.map((b) => (
            <Text key={b.start} style={[barStyles.col, barStyles.count]}>{b.sessions}</Text>
          ))}
        </View>
      ) : null}
      <View style={[barStyles.row, barStyles.track]}>
        {target ? (
          <View style={[barStyles.goal, { bottom: (target / max) * BARS_H }]} />
        ) : null}
        {buckets.map((b, i) => (
          <View
            key={b.start}
            style={[
              barStyles.col,
              barStyles.bar,
              {
                height: Math.max(4, (b.sessions / max) * BARS_H),
                backgroundColor: b.sessions === 0 ? c.ghost : i === last ? c.primaryMid : c.primary,
              },
            ]}
            accessible
            accessibilityLabel={`${bucketLabel(activity, i) || formatShortDate(b.start)}: ${b.sessions} treinos`}
          />
        ))}
      </View>
      <View style={barStyles.row}>
        {buckets.map((b, i) => (
          <Text key={b.start} style={[barStyles.col, barStyles.label]} numberOfLines={1}>
            {bucketLabel(activity, i)}
          </Text>
        ))}
      </View>
    </View>
  );
}

const useBarStyles = createStyles((c) => ({
  wrap: { marginTop: 20, gap: 4 },
  caption: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  row: { flexDirection: 'row', gap: 6 },
  track: { height: BARS_H, alignItems: 'flex-end' },
  col: { flex: 1, textAlign: 'center' },
  count: { fontFamily: FONT.mono, fontSize: 11, lineHeight: 14, color: c.textDim },
  bar: { borderRadius: 4 },
  label: { fontFamily: FONT.regular, fontSize: 10, lineHeight: 14, color: c.textSecondary },
  goal: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: c.ghostHi },
}));

// ─── Indicadores (2 colunas) ────────────────────────────────────────────────
interface KpiData {
  label: string;
  value: string;
  unit: string;
  delta: string;
  tone: 'good' | 'bad' | 'neutral';
}
const TONE_COLOR = { good: 'success', bad: 'warn', neutral: 'textSecondary' } as const;
function KpiGrid({ kpis }: { kpis: ReadonlyArray<KpiData> }) {
  const kpiStyles = useKpiStyles();
  const styles = useStyles();
  const c = useColors();
  return (
    <View style={kpiStyles.row}>
      {kpis.map((k) => (
        <View key={k.label} style={kpiStyles.cell}>
          <Text style={styles.cardSubtitleTop}>{k.label}</Text>
          <Text style={kpiStyles.value}>
            {k.value}
            {k.unit ? <Text style={kpiStyles.unit}> {k.unit}</Text> : null}
          </Text>
          <Text style={[kpiStyles.delta, { color: c[TONE_COLOR[k.tone]] }]} numberOfLines={1}>{k.delta}</Text>
        </View>
      ))}
    </View>
  );
}

const useKpiStyles = createStyles((c, s) => ({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cell: { ...s.card, flexGrow: 1, flexBasis: '45%', backgroundColor: c.surface1, borderRadius: RADIUS.xl, padding: 14, gap: 6 },
  value: { fontFamily: FONT.monoSemibold, fontSize: 22, lineHeight: 28, letterSpacing: -0.5, color: c.text },
  unit: { fontFamily: FONT.mono, fontSize: 12, letterSpacing: 0, color: c.textSecondary },
  delta: { fontFamily: FONT.mono, fontSize: 11.5, lineHeight: 16 },
}));

// ─── Análise (motor de regras do back-end) ──────────────────────────────────
function InsightBlock({ insight }: { insight: StatsInsightDTO }) {
  const insightStyles = useInsightStyles();
  const styles = useStyles();
  const c = useColors();
  return (
    <View style={insightStyles.box}>
      <View style={insightStyles.tagRow}>
        <Icon name="sparkle" size={15} color={c.primary} />
        <Text style={styles.eyebrow}>{insight.tag}</Text>
      </View>
      <Text style={insightStyles.text}>{insight.body}</Text>
    </View>
  );
}

const useInsightStyles = createStyles((c, s) => ({
  box: {
    ...s.card,
    padding: 16,
    gap: 8,
    borderRadius: RADIUS.xl,
    backgroundColor: c.surface1,
    borderWidth: 1,
    borderColor: c.primarySoft,
  },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  text: { fontFamily: FONT.regular, fontSize: 14, lineHeight: 21, color: c.text },
}));

// ─── Peso corporal ──────────────────────────────────────────────────────────
function WeightCard({ weight, period, managed, onRegister }: { weight: WeightSummaryDTO; period: StatsPeriodId; managed: boolean; onRegister: () => void }) {
  const weightStyles = useWeightStyles();
  const styles = useStyles();
  const c = useColors();
  const chartWidth = SCREEN_W - CONTENT_PAD * 2 - 32 - 24; // padding do card e eixo Y
  const data = weight.history.map((p: WeightPointDTO) => ({
    value: p.weight,
    label: p.date.length >= 10 ? p.date.substring(8, 10) : p.date,
  }));
  const start = weight.current - weight.delta;

  return (
    <View style={styles.card}>
      <CardHeader
        title="Peso corporal"
        subtitle={periodDescription(period)}
        action={
          managed ? undefined : (
            <Pressable accessibilityRole="button" onPress={onRegister} style={styles.smallBtn}>
              <Text style={styles.smallBtnText}>Registrar</Text>
            </Pressable>
          )
        }
      />

      {data.length >= 2 ? (
        <LineChart
          data={data}
          width={chartWidth}
          height={130}
          areaChart
          color={c.primary}
          thickness={2}
          startFillColor={c.primary}
          endFillColor={c.surface1}
          startOpacity={0.14}
          endOpacity={0}
          hideDataPoints
          xAxisColor="transparent"
          yAxisColor="transparent"
          yAxisTextStyle={{ color: c.textSecondary, fontSize: 10, fontFamily: FONT.mono }}
          xAxisLabelTextStyle={{ color: c.textSecondary, fontSize: 10, fontFamily: FONT.mono }}
          rulesColor={c.hairline}
          isAnimated
          initialSpacing={8}
        />
      ) : (
        <Text style={styles.emptyText}>
          {managed
            ? 'Seu peso é atualizado pelo seu personal a cada avaliação física.'
            : 'Registre seu peso para visualizar a evolução.'}
        </Text>
      )}

      <View style={weightStyles.stats}>
        <View style={styles.flex}>
          <Text style={styles.cardSubtitleTop}>Início</Text>
          <Text style={weightStyles.stat}>{formatNumberPtBR(start, 1)} {weight.unit}</Text>
        </View>
        <View style={styles.flex}>
          <Text style={styles.cardSubtitleTop}>Atual</Text>
          <Text style={weightStyles.stat}>{formatNumberPtBR(weight.current, 1)} {weight.unit}</Text>
        </View>
        <View style={styles.flex}>
          <Text style={styles.cardSubtitleTop}>Variação</Text>
          <Text style={[weightStyles.stat, { color: weight.delta <= 0 ? c.success : c.warn }]}>
            {formatSignedNumberPtBR(weight.delta, 1)} {weight.unit}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── Avaliação física: última medição do personal, variação e parecer ───────
const ASSESSMENT_METRICS: ReadonlyArray<{ key: keyof PhysicalAssessmentDTO; label: string; unit: string }> = [
  { key: 'weightKg', label: 'Peso', unit: 'kg' },
  { key: 'bodyFatPct', label: 'Gordura', unit: '%' },
  { key: 'muscleMassKg', label: 'Massa muscular', unit: 'kg' },
  { key: 'waistCm', label: 'Cintura', unit: 'cm' },
  { key: 'hipCm', label: 'Quadril', unit: 'cm' },
  { key: 'bmi', label: 'IMC', unit: '' },
];

function AssessmentCard({ assessments }: { assessments: PhysicalAssessmentDTO[] }) {
  const assessmentStyles = useAssessmentStyles();
  const weightStyles = useWeightStyles();
  const styles = useStyles();
  const latest = assessments[assessments.length - 1];
  // Variação contra a avaliação anterior mais recente que mediu o mesmo item.
  const previousOf = (key: keyof PhysicalAssessmentDTO): number | null => {
    for (let i = assessments.length - 2; i >= 0; i--) {
      const v = assessments[i][key];
      if (typeof v === 'number') return v;
    }
    return null;
  };
  const metrics = ASSESSMENT_METRICS.filter((m) => typeof latest[m.key] === 'number');

  return (
    <View style={styles.card}>
      <CardHeader
        title="Avaliação física"
        subtitle={`${formatShortDate(latest.assessedOn)}${latest.trainerName ? ` · por ${latest.trainerName}` : ''}`}
      />
      <View style={assessmentStyles.grid}>
        {metrics.map((m) => {
          const value = latest[m.key] as number;
          const prev = previousOf(m.key);
          return (
            <View key={m.key} style={assessmentStyles.cell}>
              <Text style={styles.cardSubtitleTop}>{m.label}</Text>
              <Text style={weightStyles.stat}>
                {formatNumberPtBR(value, 1)}{m.unit ? ` ${m.unit}` : ''}
              </Text>
              {prev !== null && (
                <Text style={assessmentStyles.delta}>{formatSignedNumberPtBR(value - prev, 1)} vs anterior</Text>
              )}
            </View>
          );
        })}
      </View>
      {latest.notes ? (
        <View style={assessmentStyles.notes}>
          <Text style={styles.cardSubtitleTop}>Parecer do personal</Text>
          <Text style={assessmentStyles.notesText}>{latest.notes}</Text>
        </View>
      ) : null}
    </View>
  );
}

const useAssessmentStyles = createStyles((c) => ({
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 12, marginTop: 14 },
  cell: { width: '33.33%' },
  delta: { fontFamily: FONT.mono, fontSize: 10, lineHeight: 14, color: c.textSecondary, marginTop: 1 },
  notes: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: c.hairline },
  notesText: { fontFamily: FONT.regular, fontSize: 14, lineHeight: 21, color: c.text, marginTop: 4 },
}));

const useWeightStyles = createStyles((c) => ({
  stats: { flexDirection: 'row', marginTop: 14 },
  stat: { fontFamily: FONT.monoMedium, fontSize: 14, lineHeight: 20, color: c.text, marginTop: 2 },
}));

// ─── Volume por categoria: barra de proporção + lista ───────────────────────
const CATEGORY_LABEL: Record<string, string> = {
  PUSH: 'Empurrar',
  PULL: 'Puxar',
  PERNAS: 'Pernas',
  CORE: 'Core',
};
// Mesmas cores das fichas A/B/C, para a leitura bater entre as abas.
const CATEGORY_COLOR: Record<string, keyof Palette> = {
  PUSH: 'primary',
  PULL: 'record',
  PERNAS: 'success',
  CORE: 'indigo',
};

function VolumeCard({ volume }: { volume: VolumeSummaryDTO }) {
  const volumeStyles = useVolumeStyles();
  const styles = useStyles();
  const c = useColors();
  const trained = volume.byMuscleGroup.filter((g) => !g.isRest && g.volume > 0);
  const totalDeltaSign = volume.deltaPercentage > 0 ? '+' : '';

  return (
    <View style={styles.card}>
      <CardHeader
        title="Volume por categoria"
        subtitle={`Total ${formatTotalVolume(volume.total)} · ${totalDeltaSign}${volume.deltaPercentage}% vs período anterior`}
      />

      {trained.length > 0 && (
        <View style={volumeStyles.share}>
          {trained.map((g) => (
            <View
              key={g.muscleGroup}
              style={{ flex: g.volume, backgroundColor: c[CATEGORY_COLOR[g.muscleGroup] ?? 'textSecondary'] }}
            />
          ))}
        </View>
      )}

      {volume.byMuscleGroup.map((g) => (
        <View key={g.muscleGroup} style={volumeStyles.row}>
          <View
            style={[
              volumeStyles.swatch,
              g.isRest
                ? volumeStyles.swatchRest
                : { backgroundColor: c[CATEGORY_COLOR[g.muscleGroup] ?? 'textSecondary'] },
            ]}
          />
          <Text style={volumeStyles.name}>{CATEGORY_LABEL[g.muscleGroup] ?? g.muscleGroup}</Text>
          {g.isRest ? (
            <Text style={volumeStyles.rest}>descanso</Text>
          ) : (
            <>
              <Text style={volumeStyles.kg}>{formatVolumeKg(g.volume)}</Text>
              <Text style={[volumeStyles.delta, { color: g.deltaPercentage >= 0 ? c.success : c.warn }]}>
                {formatSignedPercent(g.deltaPercentage)}
              </Text>
            </>
          )}
        </View>
      ))}
    </View>
  );
}

const useVolumeStyles = createStyles((c) => ({
  share: { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', gap: 2, marginBottom: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 40,
    borderTopWidth: 1,
    borderTopColor: c.hairline,
  },
  swatch: { width: 8, height: 8, borderRadius: 2 },
  swatchRest: { borderWidth: 1, borderStyle: 'dashed', borderColor: c.ghostHi },
  name: { flex: 1, fontFamily: FONT.regular, fontSize: 14, color: c.text },
  kg: { fontFamily: FONT.mono, fontSize: 13, color: c.text },
  delta: { width: 52, textAlign: 'right', fontFamily: FONT.mono, fontSize: 12 },
  rest: { fontFamily: FONT.regular, fontSize: 12, color: c.textSecondary },
}));

// ─── Screen ───────────────────────────────────────────────────────────────
export default function StatsScreen() {
  const styles = useStyles();
  const c = useColors();
  const navigation = useNavigation<any>();
  const [period, setPeriod] = useState<StatsPeriodId>('month');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  // O modal de atualização de peso só pode aparecer uma vez por sessão.
  // Sem isso, qualquer refetch (troca de período / pull-to-refresh) reabriria
  // o modal enquanto o backend continuar retornando needsWeightUpdate: true.
  const weightModalDismissedRef = useRef<boolean>(false);

  const summaryRes = useFocusResource(`stats/summary?${period}`, () =>
    api.get<StatsSummaryResponseDTO>('/stats/summary', { params: { period } }).then((r) => r.data),
  );
  // Evolução de ciclo independe do período: chave própria, não refaz ao trocar de período.
  const evolutionRes = useFocusResource('stats/plan-evolution', () =>
    api.get<PlanEvolutionResponseDTO>('/stats/plan-evolution').then((r) => r.data),
  );
  const assessmentsRes = useFocusResource('me/assessments', () =>
    api.get<PhysicalAssessmentDTO[]>('/me/assessments').then((r) => r.data),
  );
  const assessments = assessmentsRes.data ?? [];

  // Ao trocar de período, mantém os números anteriores na tela até os novos chegarem.
  const lastStatsRef = useRef<StatsSummaryResponseDTO | null>(null);
  if (summaryRes.data) lastStatsRef.current = summaryRes.data;
  const stats = summaryRes.data ?? lastStatsRef.current;
  const planEvolution = evolutionRes.data ?? null;
  const loading = !stats && summaryRes.loading;

  // Só pergunta o peso com base na resposta do servidor, não num cache antigo.
  useEffect(() => {
    if (summaryRes.fresh && summaryRes.data?.needsWeightUpdate && !weightModalDismissedRef.current) {
      setModalVisible(true);
    }
  }, [summaryRes.fresh, summaryRes.data]);

  const closeWeightModal = useCallback(() => {
    weightModalDismissedRef.current = true;
    setModalVisible(false);
  }, []);

  const onWeightModalSuccess = useCallback(() => {
    weightModalDismissedRef.current = true;
    setModalVisible(false);
    summaryRes.refresh();
  }, [summaryRes.refresh]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([summaryRes.refresh(), evolutionRes.refresh(), assessmentsRes.refresh()]);
    setRefreshing(false);
  }, [summaryRes.refresh, evolutionRes.refresh, assessmentsRes.refresh]);

  const kpis = useMemo<ReadonlyArray<KpiData>>(() => {
    if (!stats) return [];
    const { volume, training } = stats;
    const minutesDelta = training.minutes - training.previousMinutes;
    const record = training.latestRecord;
    return [
      {
        label: 'Volume',
        value: formatTotalVolume(volume.total),
        unit: '',
        delta: `${formatSignedPercent(volume.deltaPercentage)} vs anterior`,
        tone: volume.deltaPercentage >= 0 ? 'good' : 'bad',
      },
      {
        label: 'Tempo treinando',
        value: formatMinutes(training.minutes),
        unit: '',
        delta: `${minutesDelta >= 0 ? '↑' : '↓'} ${formatMinutes(Math.abs(minutesDelta))} vs anterior`,
        tone: minutesDelta >= 0 ? 'good' : 'bad',
      },
      {
        label: 'Recordes',
        value: String(training.recordsCount),
        unit: training.recordsCount === 1 ? 'PR' : 'PRs',
        delta: record ? `último: ${record.exercise}, ${formatKg(record.weightKg)} kg` : 'nenhum no período',
        tone: 'neutral',
      },
      {
        label: 'Sequência',
        value: String(training.streakDays),
        unit: training.streakDays === 1 ? 'dia' : 'dias',
        delta: `melhor: ${training.bestStreakDays} ${training.bestStreakDays === 1 ? 'dia' : 'dias'}`,
        tone: 'neutral',
      },
    ];
  }, [stats]);

  const weightModal = (
    <EvolutionModal
      visible={modalVisible}
      onClose={closeWeightModal}
      onSuccess={onWeightModalSuccess}
      onReviewProtocol={() => navigation.navigate('Protocol')}
    />
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={c.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const isEmpty =
    !!stats &&
    stats.volume.byMuscleGroup.length === 0 &&
    stats.weight.history.length === 0 &&
    stats.efficiencyPercentage === 0;

  if (!stats || isEmpty) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={styles.zeroContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
        >
          <View style={styles.zeroCard}>
            <View style={styles.zeroIcon}>
              <Icon name="bar-chart" size={44} color={c.primary} strokeWidth={1.5} />
            </View>
            <Text style={styles.zeroTitle}>Progresso</Text>
            <Text style={styles.zeroDesc}>
              {stats
                ? 'Seus resultados aparecem aqui depois do primeiro treino finalizado.'
                : 'Não foi possível carregar suas estatísticas. Puxe para baixo para tentar novamente.'}
            </Text>
          </View>
        </ScrollView>
        {weightModal}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
      >
        <View style={styles.titleBlock}>
          <Text style={styles.screenTitle} accessibilityRole="header">Progresso</Text>
          <Text style={styles.cardSubtitle}>{periodDescription(period)}</Text>
        </View>

        <SegmentedControl
          options={STATS_PERIODS.map((p) => ({ key: p.id, label: p.label }))}
          value={period}
          onChange={setPeriod}
          style={styles.periods}
        />

        <View style={styles.sections}>
          <StaleBanner visible={summaryRes.error} onRetry={onRefresh} />
          <ConsistencyCard
            activity={stats.activity}
            completed={stats.completedSessions}
            target={stats.targetSessions}
            efficiencyPercentage={stats.efficiencyPercentage}
            community={stats.community}
          />
          <KpiGrid kpis={kpis} />
          <InsightBlock insight={stats.insight} />
          {assessments.length > 0 && <AssessmentCard assessments={assessments} />}
          <WeightCard
            weight={stats.weight}
            period={period}
            managed={stats.weightManagedByTrainer}
            onRegister={() => setModalVisible(true)}
          />
          <VolumeCard volume={stats.volume} />
          {planEvolution && <PlanEvolutionCard data={planEvolution} />}
        </View>
      </ScrollView>
      {weightModal}
    </SafeAreaView>
  );
}

const useStyles = createStyles((c, s) => ({
  container: { flex: 1, backgroundColor: c.bg },
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: CONTENT_PAD, paddingBottom: 24 },
  titleBlock: { paddingHorizontal: 4, paddingTop: 18, gap: 2 },
  screenTitle: { fontFamily: FONT.semibold, fontSize: 24, lineHeight: 30, letterSpacing: -0.5, color: c.text },
  periods: { ...s.card, marginTop: 14, backgroundColor: c.surface1, borderRadius: RADIUS.lg },
  sections: { gap: 12, marginTop: 14 },
  card: { ...s.card, backgroundColor: c.surface1, borderRadius: RADIUS.xl, padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  cardTitle: { fontFamily: FONT.semibold, fontSize: 16, lineHeight: 22, color: c.text },
  cardSubtitle: { fontFamily: FONT.regular, fontSize: 12, lineHeight: 17, color: c.textSecondary },
  cardSubtitleTop: { fontFamily: FONT.regular, fontSize: 12, lineHeight: 16, color: c.textSecondary },
  eyebrow: { fontFamily: FONT.semibold, fontSize: 12, lineHeight: 16, color: c.primary },
  smallBtn: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: c.ghost,
    justifyContent: 'center',
  },
  smallBtnText: { fontFamily: FONT.semibold, fontSize: 12, color: c.text },
  emptyText: {
    fontFamily: FONT.regular,
    color: c.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 24,
  },
  zeroContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  zeroCard: { ...s.card, alignItems: 'center', backgroundColor: c.surface1, borderRadius: RADIUS.xl, padding: 32 },
  zeroIcon: { marginBottom: 20 },
  zeroTitle: { fontFamily: FONT.semibold, color: c.text, fontSize: 22, marginBottom: 12 },
  zeroDesc: { fontFamily: FONT.regular, color: c.textDim, fontSize: 15, textAlign: 'center', lineHeight: 22 },
}));
