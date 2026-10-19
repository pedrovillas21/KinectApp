import React, { useCallback, useMemo, useRef, useState } from 'react';
import PlanEvolutionCard from '../components/PlanEvolutionCard';
import Icon from '../components/Icon';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart } from 'react-native-gifted-charts';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import EvolutionModal from '../components/EvolutionModal';
import { SegmentedControl } from '../components/ui';
import api from '../services/api';
import {
  CommunityComparisonDTO,
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
import { STATS_T as T } from '../theme/statsTokens';
import { FONT, KINETIC, RADIUS } from '../theme/kinetic';
import { formatKg, formatMinutes, formatShortDate, parseLocalDate, weekdayLetter } from '../utils/formatters';

const SCREEN_W = Dimensions.get('window').width;
const CONTENT_PAD = 16;

// ─── Atoms ────────────────────────────────────────────────────────────────
function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
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
  const size = 84;
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * Math.max(0, Math.min(1, efficiencyPercentage / 100));
  const cmpColor = community.isAbove ? T.success : T.warn;

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
          <Circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={KINETIC.ghost} strokeWidth={8} />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={T.accent}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference - dash}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
          <SvgText
            x={size / 2}
            y={size / 2 + 5}
            textAnchor="middle"
            fill={T.text}
            fontFamily={FONT.monoSemibold}
            fontSize={16}
          >
            {`${efficiencyPercentage}%`}
          </SvgText>
        </Svg>
      </View>
      <ActivityBars activity={activity} />
      <View style={consistencyStyles.footer}>
        <Icon name={community.isAbove ? 'arrow-up' : 'arrow-down'} size={14} color={cmpColor} strokeWidth={2.2} />
        <Text style={styles.cardSubtitle}>
          <Text style={{ color: cmpColor, fontFamily: FONT.semibold }}>
            {community.isAbove ? 'Acima' : 'Abaixo'} da média
          </Text>{' '}
          da comunidade ({community.averagePercentage}%)
        </Text>
      </View>
    </View>
  );
}

const consistencyStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  value: { fontFamily: FONT.monoSemibold, fontSize: 40, lineHeight: 46, letterSpacing: -1.5, color: T.text, marginTop: 4 },
  valueDim: { fontSize: 18, letterSpacing: 0, color: KINETIC.textSecondary },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: KINETIC.hairline,
  },
});

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
                backgroundColor: b.sessions === 0 ? KINETIC.ghost : i === last ? 'rgba(0,229,255,0.45)' : T.accent,
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

const barStyles = StyleSheet.create({
  wrap: { marginTop: 20, gap: 4 },
  caption: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  row: { flexDirection: 'row', gap: 6 },
  track: { height: BARS_H, alignItems: 'flex-end' },
  col: { flex: 1, textAlign: 'center' },
  count: { fontFamily: FONT.mono, fontSize: 11, lineHeight: 14, color: KINETIC.textDim },
  bar: { borderRadius: 4 },
  label: { fontFamily: FONT.regular, fontSize: 10, lineHeight: 14, color: KINETIC.textSecondary },
  goal: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: KINETIC.ghostHi },
});

// ─── Indicadores (2 colunas) ────────────────────────────────────────────────
interface KpiData {
  label: string;
  value: string;
  unit: string;
  delta: string;
  tone: 'good' | 'bad' | 'neutral';
}
const TONE_COLOR = { good: T.success, bad: T.warn, neutral: KINETIC.textSecondary } as const;
function KpiGrid({ kpis }: { kpis: ReadonlyArray<KpiData> }) {
  return (
    <View style={kpiStyles.row}>
      {kpis.map((k) => (
        <View key={k.label} style={kpiStyles.cell}>
          <Text style={styles.cardSubtitleTop}>{k.label}</Text>
          <Text style={kpiStyles.value}>
            {k.value}
            {k.unit ? <Text style={kpiStyles.unit}> {k.unit}</Text> : null}
          </Text>
          <Text style={[kpiStyles.delta, { color: TONE_COLOR[k.tone] }]} numberOfLines={1}>{k.delta}</Text>
        </View>
      ))}
    </View>
  );
}

const kpiStyles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cell: { flexGrow: 1, flexBasis: '45%', backgroundColor: T.card, borderRadius: RADIUS.xl, padding: 14, gap: 6 },
  value: { fontFamily: FONT.monoSemibold, fontSize: 22, lineHeight: 28, letterSpacing: -0.5, color: T.text },
  unit: { fontFamily: FONT.mono, fontSize: 12, letterSpacing: 0, color: KINETIC.textSecondary },
  delta: { fontFamily: FONT.mono, fontSize: 11.5, lineHeight: 16 },
});

// ─── Análise (motor de regras do back-end) ──────────────────────────────────
function InsightBlock({ insight }: { insight: StatsInsightDTO }) {
  return (
    <View style={insightStyles.box}>
      <View style={insightStyles.tagRow}>
        <Icon name="sparkle" size={15} color={T.accent} />
        <Text style={styles.eyebrow}>{insight.tag}</Text>
      </View>
      <Text style={insightStyles.text}>{insight.body}</Text>
    </View>
  );
}

const insightStyles = StyleSheet.create({
  box: {
    padding: 16,
    gap: 8,
    borderRadius: RADIUS.xl,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.2)',
  },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  text: { fontFamily: FONT.regular, fontSize: 14, lineHeight: 21, color: 'rgba(245,246,247,0.85)' },
});

// ─── Peso corporal ──────────────────────────────────────────────────────────
function WeightCard({ weight, period, onRegister }: { weight: WeightSummaryDTO; period: StatsPeriodId; onRegister: () => void }) {
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
          <Pressable accessibilityRole="button" onPress={onRegister} style={styles.smallBtn}>
            <Text style={styles.smallBtnText}>Registrar</Text>
          </Pressable>
        }
      />

      {data.length >= 2 ? (
        <LineChart
          data={data}
          width={chartWidth}
          height={130}
          areaChart
          color={T.accent}
          thickness={2}
          startFillColor={T.accent}
          endFillColor={T.card}
          startOpacity={0.14}
          endOpacity={0}
          hideDataPoints
          xAxisColor="transparent"
          yAxisColor="transparent"
          yAxisTextStyle={{ color: KINETIC.textSecondary, fontSize: 10, fontFamily: FONT.mono }}
          xAxisLabelTextStyle={{ color: KINETIC.textSecondary, fontSize: 10, fontFamily: FONT.mono }}
          rulesColor={KINETIC.hairline}
          isAnimated
          initialSpacing={8}
        />
      ) : (
        <Text style={styles.emptyText}>Registre seu peso para visualizar a evolução.</Text>
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
          <Text style={[weightStyles.stat, { color: weight.delta <= 0 ? T.success : T.warn }]}>
            {formatSignedNumberPtBR(weight.delta, 1)} {weight.unit}
          </Text>
        </View>
      </View>
    </View>
  );
}

const weightStyles = StyleSheet.create({
  stats: { flexDirection: 'row', marginTop: 14 },
  stat: { fontFamily: FONT.monoMedium, fontSize: 14, lineHeight: 20, color: T.text, marginTop: 2 },
});

// ─── Volume por categoria: barra de proporção + lista ───────────────────────
const CATEGORY_LABEL: Record<string, string> = {
  PUSH: 'Empurrar',
  PULL: 'Puxar',
  PERNAS: 'Pernas',
  CORE: 'Core',
};
// Mesmas cores das fichas A/B/C, para a leitura bater entre as abas.
const CATEGORY_COLOR: Record<string, string> = {
  PUSH: KINETIC.primary,
  PULL: KINETIC.record,
  PERNAS: KINETIC.success,
  CORE: '#a5b4fc',
};

function VolumeCard({ volume }: { volume: VolumeSummaryDTO }) {
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
              style={{ flex: g.volume, backgroundColor: CATEGORY_COLOR[g.muscleGroup] ?? KINETIC.textSecondary }}
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
                : { backgroundColor: CATEGORY_COLOR[g.muscleGroup] ?? KINETIC.textSecondary },
            ]}
          />
          <Text style={volumeStyles.name}>{CATEGORY_LABEL[g.muscleGroup] ?? g.muscleGroup}</Text>
          {g.isRest ? (
            <Text style={volumeStyles.rest}>descanso</Text>
          ) : (
            <>
              <Text style={volumeStyles.kg}>{formatVolumeKg(g.volume)}</Text>
              <Text style={[volumeStyles.delta, { color: g.deltaPercentage >= 0 ? T.success : T.warn }]}>
                {formatSignedPercent(g.deltaPercentage)}
              </Text>
            </>
          )}
        </View>
      ))}
    </View>
  );
}

const volumeStyles = StyleSheet.create({
  share: { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', gap: 2, marginBottom: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 40,
    borderTopWidth: 1,
    borderTopColor: KINETIC.hairline,
  },
  swatch: { width: 8, height: 8, borderRadius: 2 },
  swatchRest: { borderWidth: 1, borderStyle: 'dashed', borderColor: KINETIC.ghostHi },
  name: { flex: 1, fontFamily: FONT.regular, fontSize: 14, color: T.text },
  kg: { fontFamily: FONT.mono, fontSize: 13, color: T.text },
  delta: { width: 52, textAlign: 'right', fontFamily: FONT.mono, fontSize: 12 },
  rest: { fontFamily: FONT.regular, fontSize: 12, color: KINETIC.textSecondary },
});

// ─── Screen ───────────────────────────────────────────────────────────────
export default function StatsScreen() {
  const [period, setPeriod] = useState<StatsPeriodId>('month');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [stats, setStats] = useState<StatsSummaryResponseDTO | null>(null);
  const [planEvolution, setPlanEvolution] = useState<PlanEvolutionResponseDTO | null>(null);
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

  // useFocusEffect cobre o mount, a troca de período E cada retorno de foco à aba
  // (ex.: voltar para Stats depois de finalizar um treino na aba Train). Sem isso,
  // o StatsScreen — que fica montado no tab navigator — só atualizaria via pull-to-refresh.
  useFocusEffect(
    useCallback(() => {
      fetchStats(period);
    }, [period, fetchStats]),
  );

  // Evolução de ciclo é independente do seletor de período, então tem seu próprio fetch.
  const fetchPlanEvolution = useCallback(async (): Promise<void> => {
    try {
      const res = await api.get<PlanEvolutionResponseDTO>('/stats/plan-evolution');
      setPlanEvolution(res.data);
    } catch (err) {
      console.warn('plan-evolution fetch failed', err);
    }
  }, []);

  // Re-busca a cada foco da aba (ex.: voltar para Stats após regenerar um plano). Fica num
  // useFocusEffect separado do fetchStats justamente para NÃO depender do seletor de período —
  // o callback é estável, então trocar de período não dispara um refetch aqui.
  useFocusEffect(
    useCallback(() => {
      fetchPlanEvolution();
    }, [fetchPlanEvolution]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStats(period);
    fetchPlanEvolution();
  }, [period, fetchStats, fetchPlanEvolution]);

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
    <EvolutionModal visible={modalVisible} onClose={closeWeightModal} onSuccess={onWeightModalSuccess} />
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={T.accent} />
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.accent} />}
        >
          <View style={styles.zeroCard}>
            <View style={styles.zeroIcon}>
              <Icon name="bar-chart" size={44} color={T.accent} strokeWidth={1.5} />
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.accent} />}
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
          {fetchError ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{fetchError}</Text>
            </View>
          ) : null}
          <ConsistencyCard
            activity={stats.activity}
            completed={stats.completedSessions}
            target={stats.targetSessions}
            efficiencyPercentage={stats.efficiencyPercentage}
            community={stats.community}
          />
          <KpiGrid kpis={kpis} />
          <InsightBlock insight={stats.insight} />
          <WeightCard weight={stats.weight} period={period} onRegister={() => setModalVisible(true)} />
          <VolumeCard volume={stats.volume} />
          {planEvolution && <PlanEvolutionCard data={planEvolution} />}
        </View>
      </ScrollView>
      {weightModal}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: CONTENT_PAD, paddingBottom: 24 },
  titleBlock: { paddingHorizontal: 4, paddingTop: 18, gap: 2 },
  screenTitle: { fontFamily: FONT.semibold, fontSize: 24, lineHeight: 30, letterSpacing: -0.5, color: T.text },
  periods: { marginTop: 14, backgroundColor: T.card, borderRadius: RADIUS.lg },
  sections: { gap: 12, marginTop: 14 },
  card: { backgroundColor: T.card, borderRadius: RADIUS.xl, padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  cardTitle: { fontFamily: FONT.semibold, fontSize: 16, lineHeight: 22, color: T.text },
  cardSubtitle: { fontFamily: FONT.regular, fontSize: 12, lineHeight: 17, color: KINETIC.textSecondary },
  cardSubtitleTop: { fontFamily: FONT.regular, fontSize: 12, lineHeight: 16, color: KINETIC.textSecondary },
  eyebrow: { fontFamily: FONT.semibold, fontSize: 12, lineHeight: 16, color: T.accent },
  smallBtn: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: KINETIC.ghost,
    justifyContent: 'center',
  },
  smallBtnText: { fontFamily: FONT.semibold, fontSize: 12, color: T.text },
  emptyText: {
    fontFamily: FONT.regular,
    color: KINETIC.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 24,
  },
  zeroContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  zeroCard: { alignItems: 'center', backgroundColor: T.card, borderRadius: RADIUS.xl, padding: 32 },
  zeroIcon: { marginBottom: 20 },
  zeroTitle: { fontFamily: FONT.semibold, color: T.text, fontSize: 22, marginBottom: 12 },
  zeroDesc: { fontFamily: FONT.regular, color: KINETIC.textDim, fontSize: 15, textAlign: 'center', lineHeight: 22 },
  errorBanner: {
    backgroundColor: T.warnDim,
    borderWidth: 1,
    borderColor: 'rgba(245,185,69,0.45)',
    borderRadius: RADIUS.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorBannerText: { fontFamily: FONT.semibold, color: T.warn, fontSize: 12, lineHeight: 17 },
});
