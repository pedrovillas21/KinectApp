import React, { useContext, useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeContext } from '../contexts/ThemeContext';
import { COLORS } from '../theme/colors';
import AppHeader from '../components/AppHeader';
import api from '../services/api';

// Mock Ranking Data
const LEADERS = [
  { id: '1', name: 'Alex Sterling',  minutes: 340, rank: 1, medal: '#FFD700' },
  { id: '2', name: 'Marcus Chen',    minutes: 290, rank: 2, medal: '#C0C0C0' },
  { id: '3', name: 'Sarah Jenkins',  minutes: 215, rank: 3, medal: '#CD7F32' },
  { id: '4', name: 'You',            minutes: 180, rank: 4, medal: 'transparent' },
];

export default function HomeScreen({ navigation }) {
  const { isDarkMode } = useContext(ThemeContext);
  const isDark = isDarkMode;

  const [isTracking, setIsTracking] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const intervalRef = useRef(null);
  const [stats, setStats] = useState({
    completedSessions: 0,
    targetSessions: 0,
    efficiency: 0,
  });

  const [activityData, setActivityData] = useState([0, 0, 0, 0, 0, 0, 0]);

  const fetchMonthlyStats = async () => {
    try {
      const response = await api.get('/sessions/monthly-stats');
      setStats(response.data);
    } catch (e) {
      console.error('Erro ao carregar estatisticas mensais:', e);
    }
  };

  useEffect(() => {
    fetchMonthlyStats();
    return () => clearInterval(intervalRef.current);
  }, []);

  const getTodayISODate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleToggleWorkout = async () => {
    if (isTracking) {
      clearInterval(intervalRef.current);
      setIsTracking(false);

      try {
        if (elapsedTime > 0) {
          await api.post('/sessions/log', {
            durationInSeconds: elapsedTime,
            date: getTodayISODate(),
          });

          const currentDayIndex = new Date().getDay();
          const minutesSpent = Math.max(1, Math.round(elapsedTime / 60));

          setActivityData(prev => {
            const newData = [...prev];
            newData[currentDayIndex] += minutesSpent;
            return newData;
          });

          await fetchMonthlyStats();
        }
        setElapsedTime(0);
      } catch (e) {
        Alert.alert('Erro', 'Nao foi possivel registrar o treino. Tente novamente.');
      }

    } else {
      setIsTracking(true);
      intervalRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
  const todayIndex = new Date().getDay();
  const visualEfficiency = Math.min(Math.max(stats.efficiency || 0, 0), 100);
  const progressText = stats.targetSessions === 0
    ? 'Gere seu primeiro treino para definir sua meta!'
    : `${stats.completedSessions} out of ${stats.targetSessions} sessions completed this month. Keep the momentum high.`;
  const progressRingStyle = {
    borderTopColor: visualEfficiency > 0 ? COLORS.neonBlue : '#333',
    borderRightColor: visualEfficiency >= 25 ? COLORS.neonBlue : '#333',
    borderBottomColor: visualEfficiency >= 50 ? COLORS.neonBlue : '#333',
    borderLeftColor: visualEfficiency >= 75 ? COLORS.neonBlue : '#333',
  };

  const THEME = {
    bg: isDark ? COLORS.darkBackground : COLORS.lightBackground,
    textPrimary: isDark ? COLORS.textPrimaryDark : COLORS.textPrimaryLight,
    textSec: isDark ? COLORS.textSecondaryDark : COLORS.textSecondaryLight,
    card: isDark ? COLORS.darkCard : COLORS.lightCard
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: THEME.bg }]}>
      <AppHeader />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.progressSection}>
          <Text style={styles.sectionOverline}>MONTHLY PROGRESS</Text>
          <Text style={[styles.titleLine, { color: THEME.textPrimary }]}>
            You're crushing
          </Text>
          <Text style={[styles.titleLine, { color: THEME.textPrimary }]}>
            the <Text style={{ color: COLORS.neonBlue, fontStyle: 'italic' }}>Kinetic</Text> pace.
          </Text>
          <Text style={styles.progressDesc}>
            {progressText}
          </Text>
        </View>

        <View style={styles.efficiencyCircle}>
          <View style={[styles.ringOuter, progressRingStyle]}>
            <View style={styles.ringInner}>
              <Text style={styles.effValue}>{stats.efficiency}<Text style={{ fontSize: 20 }}>%</Text></Text>
              <Text style={styles.effLabel}>EFFICIENCY</Text>
            </View>
          </View>
        </View>

        <View style={styles.checkinCard}>
          <Text style={styles.checkinIcon}>{isTracking ? 'timer' : 'check'}</Text>
          <Text style={styles.checkinTitle}>{isTracking ? 'Workout in progress' : 'Check-in Now'}</Text>
          <Text style={[styles.checkinDesc, isTracking && { fontSize: 32, fontWeight: 'bold', color: '#FFF' }]}>
            {isTracking ? formatTime(elapsedTime) : 'Log sua sessao para o ranking.'}
          </Text>
          <TouchableOpacity
            style={[styles.startWorkoutBtn, isTracking && { backgroundColor: '#FF3B30' }]}
            onPress={handleToggleWorkout}
          >
            <Text style={[styles.startWorkoutText, isTracking && { color: '#FFF' }]}>
              {isTracking ? 'FINALIZAR TREINO' : 'INICIAR TEMPO'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.routineHeader}>
          <View>
            <Text style={styles.routineTitle}>KINECT LIDERSHIP</Text>
            <Text style={styles.routineSub}>Competicao semanal de tempo na arena.</Text>
          </View>
        </View>

        <View style={[styles.leaderboardCard, { backgroundColor: THEME.card }]}>
          {LEADERS.map((ldr, index) => (
            <View key={ldr.id} style={[styles.leaderRow, index !== LEADERS.length - 1 && styles.leaderBorder]}>
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
                    <View style={[styles.barFill, { height, backgroundColor: isToday ? COLORS.neonBlue : '#333' }]} />
                  </View>
                  <Text style={[styles.barLabel, isToday && { color: COLORS.neonBlue }]}>{weekDays[idx]}</Text>
                </View>
              );
            })}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  progressSection: { marginTop: 16, alignItems: 'center' },
  sectionOverline: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
    color: '#888',
    marginBottom: 12,
  },
  titleLine: {
    fontSize: 32,
    fontStyle: 'italic',
    fontWeight: '900',
    lineHeight: 38,
    textAlign: 'center',
  },
  progressDesc: {
    color: '#AAA',
    textAlign: 'center',
    fontSize: 13,
    marginTop: 16,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  efficiencyCircle: {
    alignItems: 'center',
    marginVertical: 32,
  },
  ringOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 6,
    borderColor: '#333',
    borderRightColor: COLORS.neonBlue,
    borderBottomColor: COLORS.neonBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  effValue: {
    color: '#FFF',
    fontSize: 36,
    fontWeight: 'bold',
  },
  effLabel: {
    color: '#888',
    fontSize: 10,
    letterSpacing: 1,
    marginTop: -4,
  },
  checkinCard: {
    backgroundColor: COLORS.neonBlue,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 40,
  },
  checkinIcon: { color: COLORS.darkBackground, fontSize: 24, marginBottom: 8 },
  checkinTitle: { color: COLORS.darkBackground, fontSize: 18, fontWeight: 'bold', marginBottom: 6 },
  checkinDesc: { color: COLORS.darkBackground, fontSize: 13, marginBottom: 16, textAlign: 'center' },
  startWorkoutBtn: {
    backgroundColor: '#FFF',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  startWorkoutText: {
    color: COLORS.darkBackground,
    fontWeight: 'bold',
    fontSize: 12,
  },
  routineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  routineTitle: { color: COLORS.neonBlue, fontSize: 18, fontStyle: 'italic', fontWeight: '900', letterSpacing: 1 },
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
  leaderBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  leaderRankCol: {
    width: 32,
    alignItems: 'center',
  },
  leaderRankTxt: {
    color: '#888',
    fontSize: 16,
    fontWeight: 'bold',
    fontStyle: 'italic',
  },
  leaderInfoCol: {
    flex: 1,
    paddingLeft: 12,
  },
  leaderName: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  leaderMin: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  medalDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statsCard: {
    borderRadius: 16,
    padding: 24,
  },
  statsLabel: { color: '#666', fontSize: 10, letterSpacing: 1, fontWeight: 'bold', marginBottom: 24 },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
    marginTop: 8,
  },
  barCol: {
    alignItems: 'center',
    width: 40,
  },
  barWrap: {
    height: 80,
    justifyContent: 'flex-end',
    width: 14,
    backgroundColor: '#1C1C1C',
    borderRadius: 7,
    overflow: 'hidden',
    marginBottom: 8,
  },
  barFill: {
    width: '100%',
    borderRadius: 7,
  },
  barLabel: {
    color: '#888',
    fontSize: 9,
    fontWeight: 'bold',
  }
});
