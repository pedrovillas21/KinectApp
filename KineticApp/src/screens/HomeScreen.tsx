import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemeContext } from '../contexts/ThemeContext';
import { COLORS } from '../theme/colors';
import AppHeader from '../components/AppHeader';
import api from '../services/api';
import { PieChart } from 'react-native-gifted-charts';
import { HomeDashboardResponseDTO } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeaderboardEntry {
  id: string;
  name: string;
  minutes: number;
  rank: number;
  medal: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LEADERS: LeaderboardEntry[] = [
  { id: '1', name: 'Alex Sterling', minutes: 340, rank: 1, medal: '#FFD700' },
  { id: '2', name: 'Marcus Chen',   minutes: 290, rank: 2, medal: '#C0C0C0' },
  { id: '3', name: 'Sarah Jenkins', minutes: 215, rank: 3, medal: '#CD7F32' },
  { id: '4', name: 'You',           minutes: 180, rank: 4, medal: 'transparent' },
];

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

const EMPTY_DASHBOARD: HomeDashboardResponseDTO = {
  completedSessions: 0,
  targetSessions: 0,
  efficiencyPercentage: 0,
};

// ─── Component ────────────────────────────────────────────────────────────────

interface HomeScreenProps {
  navigation: { navigate: (screen: string) => void };
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { isDarkMode } = useContext(ThemeContext);

  const [dashboard, setDashboard] = useState<HomeDashboardResponseDTO>(EMPTY_DASHBOARD);
  const [activityData] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);

  const fetchMonthlyStats = async (): Promise<void> => {
    try {
      const response = await api.get('/sessions/monthly-stats');
      const raw = response.data;
      setDashboard({
        completedSessions: Number(raw.completedSessions) || 0,
        targetSessions: Number(raw.targetSessions) || 0,
        efficiencyPercentage: Number(raw.efficiencyPercentage ?? raw.efficiency) || 0,
      });
    } catch (e) {
      console.error('Erro ao carregar estatísticas mensais:', e);
    }
  };

  useEffect(() => {
    fetchMonthlyStats();
  }, []);

  const todayIndex = new Date().getDay();
  const visualEfficiency = Math.min(Math.max(dashboard.efficiencyPercentage, 0), 100);

  const progressText =
    dashboard.targetSessions === 0
      ? 'Gere seu primeiro treino para definir sua meta!'
      : `${dashboard.completedSessions} out of ${dashboard.targetSessions} sessions completed this month. Keep the momentum high.`;

  const donutData = [
    { value: visualEfficiency, color: '#00FFFF' },
    { value: 100 - visualEfficiency, color: '#2A2A2A' },
  ];

  const THEME = {
    bg: isDarkMode ? COLORS.darkBackground : COLORS.lightBackground,
    textPrimary: isDarkMode ? COLORS.textPrimaryDark : COLORS.textPrimaryLight,
    textSec: isDarkMode ? COLORS.textSecondaryDark : COLORS.textSecondaryLight,
    card: isDarkMode ? COLORS.darkCard : COLORS.lightCard,
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: THEME.bg }]}>
      <AppHeader />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Monthly Progress ─────────────────────────────────────────── */}
        <View style={styles.progressSection}>
          <Text style={styles.sectionOverline}>MONTHLY PROGRESS</Text>
          <Text style={[styles.titleLine, { color: THEME.textPrimary }]}>
            You're crushing
          </Text>
          <Text style={[styles.titleLine, { color: THEME.textPrimary }]}>
            the{' '}
            <Text style={styles.titleKinetic}>Kinetic</Text>
            {' '}pace.
          </Text>
          <Text style={styles.progressDesc}>{progressText}</Text>

          <PieChart
            donut
            innerCircleColor={THEME.bg}
            radius={70}
            innerRadius={55}
            data={donutData}
            centerLabelComponent={() => (
              <View style={styles.donutCenter}>
                <Text style={styles.donutValue}>{visualEfficiency}%</Text>
                <Text style={styles.donutEffLabel}>EFFICIENCY</Text>
              </View>
            )}
          />
        </View>

        {/* ── Check-in Card ────────────────────────────────────────────── */}
        <LinearGradient
          colors={['#00E5FF', '#00daf3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.checkinCard}
        >
          <View style={styles.checkIconCircle}>
            <Text style={styles.checkIconText}>✓</Text>
          </View>

          <Text style={styles.checkinTitle}>Check-in Now</Text>
          <Text style={styles.checkinDesc}>Log your current session at the Arena</Text>

          <TouchableOpacity
            style={styles.startWorkoutBtn}
            onPress={() => navigation.navigate('Train')}
            activeOpacity={0.85}
          >
            <Text style={styles.startWorkoutText}>START WORKOUT</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* ── Leaderboard ──────────────────────────────────────────────── */}
        <View style={styles.routineHeader}>
          <View>
            <Text style={styles.routineTitle}>KINECT LIDERSHIP</Text>
            <Text style={styles.routineSub}>Competição semanal de tempo na arena.</Text>
          </View>
        </View>

        <View style={[styles.leaderboardCard, { backgroundColor: THEME.card }]}>
          {LEADERS.map((ldr, index) => (
            <View
              key={ldr.id}
              style={[styles.leaderRow, index % 2 === 1 && styles.leaderRowAlt]}
            >
              <View style={styles.leaderRankCol}>
                <Text style={[styles.leaderRankTxt, ldr.rank <= 3 && { color: ldr.medal }]}>
                  {ldr.rank}o
                </Text>
              </View>
              <View style={styles.leaderInfoCol}>
                <Text style={styles.leaderName}>{ldr.name}</Text>
                <Text style={styles.leaderMin}>{ldr.minutes} min</Text>
              </View>
              {ldr.rank <= 3 && (
                <View style={[styles.medalDot, { backgroundColor: ldr.medal }]} />
              )}
            </View>
          ))}
        </View>

        {/* ── Weekly Activity ──────────────────────────────────────────── */}
        <View style={[styles.statsCard, { backgroundColor: THEME.card }]}>
          <Text style={styles.statsLabel}>WEEKLY ACTIVITY (MINUTES)</Text>

          <View style={styles.chartContainer}>
            {activityData.map((val, idx) => {
              const maxVal = Math.max(...activityData, 60);
              const height = (val / maxVal) * 80;
              const isToday = idx === todayIndex;

              return (
                <View key={idx} style={styles.barCol}>
                  <View style={styles.barWrap}>
                    <View
                      style={[
                        styles.barFill,
                        { height, backgroundColor: isToday ? COLORS.neonBlue : '#333' },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barLabel, isToday && { color: COLORS.neonBlue }]}>
                    {WEEK_DAYS[idx]}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },

  // Progress section
  progressSection: {
    marginTop: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  sectionOverline: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    color: '#A0A0A0',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  titleLine: {
    fontSize: 32,
    fontStyle: 'italic',
    fontWeight: '900',
    lineHeight: 38,
    textAlign: 'center',
  },
  titleKinetic: {
    color: '#00E5FF',
    fontStyle: 'italic',
  },
  progressDesc: {
    color: '#A0A0A0',
    textAlign: 'center',
    fontSize: 13,
    marginTop: 16,
    marginBottom: 28,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  donutCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutValue: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
  },
  donutEffLabel: {
    color: '#A0A0A0',
    fontSize: 9,
    letterSpacing: 1,
    fontWeight: '600',
    marginTop: -2,
  },

  // Check-in card
  checkinCard: {
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    marginBottom: 40,
  },
  checkIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  checkIconText: {
    color: '#131313',
    fontSize: 20,
    fontWeight: 'bold',
  },
  checkinTitle: {
    color: '#131313',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  checkinDesc: {
    color: 'rgba(0,0,0,0.55)',
    fontSize: 13,
    marginBottom: 20,
    textAlign: 'center',
  },
  startWorkoutBtn: {
    backgroundColor: '#131313',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 30,
    shadowColor: '#00daf3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 32,
    elevation: 4,
  },
  startWorkoutText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 1,
  },

  // Leaderboard
  routineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  routineTitle: {
    color: COLORS.neonBlue,
    fontSize: 18,
    fontStyle: 'italic',
    fontWeight: '900',
    letterSpacing: 1,
  },
  routineSub: { color: '#888', fontSize: 12, marginTop: 4 },
  leaderboardCard: {
    borderRadius: 16,
    paddingVertical: 8,
    marginBottom: 32,
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  leaderRowAlt: {
    backgroundColor: 'rgba(255,255,255,0.025)',
  },
  leaderRankCol: { width: 32, alignItems: 'center' },
  leaderRankTxt: {
    color: '#888',
    fontSize: 16,
    fontWeight: 'bold',
    fontStyle: 'italic',
  },
  leaderInfoCol: { flex: 1, paddingLeft: 12 },
  leaderName: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  leaderMin: { color: '#888', fontSize: 12, marginTop: 2 },
  medalDot: { width: 12, height: 12, borderRadius: 6 },

  // Weekly activity
  statsCard: { borderRadius: 16, padding: 24 },
  statsLabel: {
    color: '#666',
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
    marginTop: 8,
  },
  barCol: { alignItems: 'center', width: 40 },
  barWrap: {
    height: 80,
    justifyContent: 'flex-end',
    width: 14,
    backgroundColor: '#1C1C1C',
    borderRadius: 7,
    overflow: 'hidden',
    marginBottom: 8,
  },
  barFill: { width: '100%', borderRadius: 7 },
  barLabel: { color: '#888', fontSize: 9, fontWeight: 'bold' },
});
