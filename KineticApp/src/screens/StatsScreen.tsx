import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '../components/AppHeader';
import { LineChart, BarChart, PieChart } from 'react-native-gifted-charts';
import api from '../services/api';
import {
  StatsSummaryResponseDTO,
  VolumeByMuscleGroupDTO,
  WeightPointDTO,
} from '../types';
import EvolutionModal from '../components/EvolutionModal';

// Design tokens
const CYAN = '#00FFFF';
const SCREEN_BG = '#121212';
const CARD_BG = '#1E1E1E';
const TRACK_COLOR = '#2A2A2A';
const SECONDARY_TEXT = '#A0A0A0';
const INSIGHT_BG = '#0D2626';

function formatVolume(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(value);
}

type TrendDirection = 'up' | 'down' | 'stable';

function calcTrend(history: WeightPointDTO[]): TrendDirection {
  if (history.length < 2) return 'stable';
  const first = history[0].weight;
  const last = history[history.length - 1].weight;
  if (last < first) return 'down';
  if (last > first) return 'up';
  return 'stable';
}

function InsightBox({ text }: { text: string }) {
  return (
    <View style={insightStyles.box}>
      <Text style={insightStyles.text}>
        <Text style={insightStyles.label}>Insight: </Text>
        {text}
      </Text>
    </View>
  );
}

const insightStyles = StyleSheet.create({
  box: {
    backgroundColor: INSIGHT_BG,
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    alignSelf: 'stretch',
  },
  label: {
    color: CYAN,
    fontWeight: 'bold',
    fontSize: 13,
  },
  text: {
    color: '#C8ECEC',
    fontSize: 13,
    lineHeight: 19,
  },
});

export default function StatsScreen() {
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [stats, setStats] = useState<StatsSummaryResponseDTO | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  const fetchStats = async (): Promise<void> => {
    try {
      const response = await api.get('/stats/summary');
      const data: StatsSummaryResponseDTO = response.data;
      setStats(data);
      if (data.needsWeightUpdate) {
        setModalVisible(true);
      }
    } catch (error) {
      console.error('Error fetching stats', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStats();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={CYAN} />
        </View>
      </SafeAreaView>
    );
  }

  const hasVolume = stats?.volumeByMuscleGroup != null && stats.volumeByMuscleGroup.length > 0;
  const hasWeight = stats?.weightHistory != null && stats.weightHistory.length > 0;

  if (!stats || (!hasVolume && !hasWeight && stats.efficiencyPercentage === 0)) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader />
        <ScrollView
          contentContainerStyle={styles.zeroStateContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={CYAN} />
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
          onClose={() => setModalVisible(false)}
          onSuccess={fetchStats}
        />
      </SafeAreaView>
    );
  }

  // Donut chart data
  const pieData = [
    { value: stats.efficiencyPercentage, color: CYAN },
    { value: 100 - stats.efficiencyPercentage, color: TRACK_COLOR },
  ];

  // Line chart data
  const weightData = stats.weightHistory.map((w: WeightPointDTO) => ({
    value: w.weight,
    label: w.date.substring(5, 10).replace('-', '/'),
  }));

  // Bar chart scale — 20% headroom so bars never clip the card top
  const maxVolume = Math.max(...stats.volumeByMuscleGroup.map(v => v.volume), 0);
  const chartMaxValue = maxVolume > 0 ? maxVolume * 1.2 : 100;

  // Bar chart data with formatted top labels
  const volumeData = stats.volumeByMuscleGroup.map((v: VolumeByMuscleGroupDTO) => ({
    value: v.volume,
    label: v.muscleGroup.toUpperCase(),
    topLabelComponent: () => (
      <Text style={styles.barTopLabel}>{formatVolume(v.volume)}</Text>
    ),
  }));

  const trend = calcTrend(stats.weightHistory);
  const trendLabel =
    trend === 'down' ? '↓ Tendência' : trend === 'up' ? '↑ Tendência' : '→ Estável';

  // Contextual insight texts
  const efficiencyInsight =
    stats.efficiencyPercentage >= 75
      ? 'Sua frequência está acima da média! Mantenha o ritmo para consolidar o hábito.'
      : 'Continue comparecendo aos treinos para construir consistência ao longo do mês.';

  const weightInsight =
    trend === 'down'
      ? 'Perda de peso consistente. Sua taxa de queima calórica está otimizada.'
      : trend === 'up'
      ? 'Peso em alta. Verifique sua nutrição e hidratação para manter o progresso.'
      : 'Peso estável. Ótimo sinal de equilíbrio entre dieta e treino.';

  const totalVolume = stats.volumeByMuscleGroup.reduce(
    (acc: number, v: VolumeByMuscleGroupDTO) => acc + v.volume,
    0
  );
  const volumeInsight =
    totalVolume > 0
      ? 'Volume total em crescimento esta semana. Ótimo sinal de sobrecarga progressiva para hipertrofia.'
      : 'Complete um treino nesta semana para visualizar seu volume por grupo muscular.';

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={CYAN} />
        }
      >
        {/* Screen header */}
        <View style={styles.screenHeader}>
          <Text style={styles.screenTitle}>Sua Evolução</Text>
          <Text style={styles.screenSubtitle}>
            Os números não mentem. Continue forçando os limites.
          </Text>
        </View>

        {/* Card 1 — Consistência do Mês */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Consistência do Mês</Text>
            <Text style={styles.cardIcon}>📅</Text>
          </View>

          <PieChart
            donut
            innerCircleColor={CARD_BG}
            radius={75}
            innerRadius={58}
            data={pieData}
            centerLabelComponent={() => (
              <View style={styles.donutCenter}>
                <Text style={styles.donutPercent}>{stats.efficiencyPercentage}%</Text>
                <Text style={styles.donutLabel}>EFICIÊNCIA</Text>
              </View>
            )}
          />

          <Text style={styles.efficiencySubtext}>
            {stats.completedSessions > 0 && stats.targetSessions > 0
              ? `${stats.completedSessions} de ${stats.targetSessions} treinos concluídos neste mês`
              : `${stats.efficiencyPercentage}% de eficiência nos treinos deste mês`}
          </Text>

          <InsightBox text={efficiencyInsight} />
        </View>

        {/* Card 2 — Peso Corporal */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Peso Corporal</Text>
            <Text style={styles.cardIcon}>⏳</Text>
          </View>

          {hasWeight ? (
            <>
              <View style={styles.trendTagRow}>
                <View style={styles.trendTag}>
                  <Text style={styles.trendTagText}>{trendLabel}</Text>
                </View>
              </View>

              <LineChart
                data={weightData}
                width={280}
                height={140}
                areaChart
                color={CYAN}
                thickness={2}
                startFillColor={CYAN}
                endFillColor={CARD_BG}
                startOpacity={0.3}
                endOpacity={0}
                dataPointsColor={CYAN}
                dataPointsRadius={4}
                xAxisColor="transparent"
                yAxisColor="transparent"
                yAxisTextStyle={{ color: SECONDARY_TEXT, fontSize: 10 }}
                xAxisLabelTextStyle={{ color: SECONDARY_TEXT, fontSize: 10 }}
                hideRules
                isAnimated
                curved
              />
            </>
          ) : (
            <Text style={styles.emptyText}>Sem dados de peso registrados ainda.</Text>
          )}

          <InsightBox text={weightInsight} />
        </View>

        {/* Card 3 — Carga Semanal */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Carga Semanal</Text>
            <Text style={styles.cardIcon}>🏋️</Text>
          </View>

          {hasVolume ? (
            <BarChart
              data={volumeData}
              maxValue={chartMaxValue}
              noOfSections={4}
              width={280}
              height={200}
              barWidth={28}
              frontColor={CYAN}
              barBorderRadius={4}
              yAxisTextStyle={{ color: SECONDARY_TEXT, fontSize: 10 }}
              xAxisLabelTextStyle={{ color: SECONDARY_TEXT, fontSize: 10 }}
              xAxisColor="transparent"
              yAxisColor="transparent"
              hideRules
              isAnimated
            />
          ) : (
            <Text style={styles.emptyText}>Complete um treino para ver o volume semanal.</Text>
          )}

          <InsightBox text={volumeInsight} />
        </View>
      </ScrollView>

      <EvolutionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={fetchStats}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SCREEN_BG,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 48,
  },
  screenHeader: {
    paddingTop: 20,
    marginBottom: 16,
  },
  screenTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  screenSubtitle: {
    color: SECONDARY_TEXT,
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardIcon: {
    fontSize: 18,
  },
  donutCenter: {
    alignItems: 'center',
  },
  donutPercent: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  donutLabel: {
    color: SECONDARY_TEXT,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
  },
  efficiencySubtext: {
    color: SECONDARY_TEXT,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 16,
  },
  trendTagRow: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  trendTag: {
    backgroundColor: '#1A3A3A',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  trendTagText: {
    color: CYAN,
    fontSize: 13,
    fontWeight: '600',
  },
  barTopLabel: {
    color: SECONDARY_TEXT,
    fontSize: 11,
    marginBottom: 4,
  },
  emptyText: {
    color: '#555555',
    fontSize: 14,
    paddingVertical: 24,
    textAlign: 'center',
  },
  zeroStateContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  zeroCard: {
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 32,
  },
  zeroIcon: {
    fontSize: 52,
    marginBottom: 20,
  },
  zeroTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 12,
  },
  zeroDesc: {
    color: SECONDARY_TEXT,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});
