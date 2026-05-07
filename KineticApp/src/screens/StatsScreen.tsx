import React, { useContext, useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeContext } from '../contexts/ThemeContext';
import { COLORS } from '../theme/colors';
import AppHeader from '../components/AppHeader';
import { LineChart, BarChart, PieChart } from 'react-native-gifted-charts';
import api from '../services/api';
import { StatsSummaryResponseDTO } from '../types';
import EvolutionModal from '../components/EvolutionModal';

export default function StatsScreen() {
  const { isDarkMode } = useContext(ThemeContext);
  const isDark = isDarkMode;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<StatsSummaryResponseDTO | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchStats = async () => {
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
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? COLORS.darkBackground : COLORS.lightBackground }]}>
        <AppHeader />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.neonBlue} />
        </View>
      </SafeAreaView>
    );
  }

  // Zero State Verification
  const hasVolume = stats?.volumeByMuscleGroup && stats.volumeByMuscleGroup.length > 0;
  const hasWeight = stats?.weightHistory && stats.weightHistory.length > 0;
  
  if (!stats || (!hasVolume && !hasWeight && stats.efficiencyPercentage === 0)) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? COLORS.darkBackground : COLORS.lightBackground }]}>
        <AppHeader />
        <ScrollView 
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.neonBlue} />}
        >
          <View style={styles.placeholderCard}>
            <Text style={styles.placeholderIcon}>📊</Text>
            <Text style={styles.placeholderTitle}>Estatísticas</Text>
            <Text style={styles.placeholderDesc}>
              Seu primeiro gráfico aparecerá após o primeiro treino finalizado! Complete um treino para ver seu progresso.
            </Text>
          </View>
        </ScrollView>
        <EvolutionModal visible={modalVisible} onClose={() => setModalVisible(false)} onSuccess={fetchStats} />
      </SafeAreaView>
    );
  }

  // Data Formatting for Charts
  const weightData = stats.weightHistory.map(w => ({
    value: w.weight,
    label: w.date.substring(5, 10).replace('-', '/') // MM/DD
  }));

  const volumeData = stats.volumeByMuscleGroup.map(v => ({
    value: v.volume,
    label: v.muscleGroup.substring(0, 3).toUpperCase() // MAX 3 chars
  }));

  const pieData = [
    { value: stats.efficiencyPercentage, color: COLORS.neonBlue },
    { value: 100 - stats.efficiencyPercentage, color: '#333' }
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? COLORS.darkBackground : COLORS.lightBackground }]}>
      <AppHeader />

      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.neonBlue} />}
      >
        <Text style={styles.screenTitle}>DASHBOARD</Text>

        {/* EFFICIENCY CIRCLE */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Eficiência do Mês</Text>
          <View style={styles.pieContainer}>
            <PieChart
              donut
              radius={60}
              innerRadius={45}
              data={pieData}
              centerLabelComponent={() => {
                return <Text style={styles.pieCenterText}>{stats.efficiencyPercentage}%</Text>;
              }}
            />
            <Text style={styles.efficiencySub}>Com base na sua meta semanal</Text>
          </View>
        </View>

        {/* WEIGHT EVOLUTION */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Evolução de Peso</Text>
          {weightData.length > 0 ? (
            <LineChart
              data={weightData}
              width={280}
              height={150}
              color={COLORS.neonBlue}
              thickness={3}
              dataPointsColor={COLORS.neonBlue}
              textColor="#FFF"
              xAxisColor="#555"
              yAxisColor="#555"
              yAxisTextStyle={{ color: '#888', fontSize: 10 }}
              xAxisLabelTextStyle={{ color: '#888', fontSize: 10 }}
              hideRules
              isAnimated
            />
          ) : (
             <Text style={styles.emptyText}>Sem dados de peso no momento.</Text>
          )}
        </View>

        {/* VOLUME BY MUSCLE */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Volume (Semana Atual)</Text>
          {volumeData.length > 0 ? (
            <BarChart
              data={volumeData}
              width={280}
              height={150}
              barWidth={22}
              frontColor={COLORS.neonBlue}
              yAxisTextStyle={{ color: '#888', fontSize: 10 }}
              xAxisLabelTextStyle={{ color: '#888', fontSize: 10 }}
              hideRules
              isAnimated
            />
          ) : (
            <Text style={styles.emptyText}>Complete um treino nesta semana para ver o volume.</Text>
          )}
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
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  screenTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '900',
    marginVertical: 20,
  },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  cardTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  pieContainer: {
    alignItems: 'center',
  },
  pieCenterText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  efficiencySub: {
    color: '#888',
    fontSize: 12,
    marginTop: 12,
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
    paddingVertical: 20,
  },
  placeholderCard: {
    alignItems: 'center',
    padding: 32,
  },
  placeholderIcon: { fontSize: 52, marginBottom: 20 },
  placeholderTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '900',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  placeholderDesc: {
    color: '#666',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
});
