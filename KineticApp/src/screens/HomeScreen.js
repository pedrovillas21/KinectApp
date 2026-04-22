import React, { useContext, useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeContext } from '../contexts/ThemeContext';
import { COLORS } from '../theme/colors';
import AppHeader from '../components/AppHeader';

// Mock Ranking Data
const LEADERS = [
  { id: '1', name: 'Alex Sterling',  minutes: 340, rank: 1, medal: '#FFD700' }, // Gold
  { id: '2', name: 'Marcus Chen',    minutes: 290, rank: 2, medal: '#C0C0C0' }, // Silver
  { id: '3', name: 'Sarah Jenkins',  minutes: 215, rank: 3, medal: '#CD7F32' }, // Bronze
  { id: '4', name: 'You',            minutes: 180, rank: 4, medal: 'transparent' }, 
];

export default function HomeScreen({ navigation }) {
  const { isDarkMode } = useContext(ThemeContext);
  const isDark = isDarkMode;

  // Timer State
  const [isTracking, setIsTracking] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const intervalRef = useRef(null);

  // Dynamic Weekly Activity Array (Domingo a Sábado, posições 0 a 6 do Javascript Array)
  const [activityData, setActivityData] = useState([0, 0, 0, 0, 0, 0, 0]);

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  const handleToggleWorkout = () => {
    if (isTracking) {
      clearInterval(intervalRef.current);
      setIsTracking(false);

      // Captura o dia da semana atual pelo dispositivo (0 = Dom, 1 = Seg, ..., 6 = Sáb)
      const currentDayIndex = new Date().getDay();
      
      // Simulação acelerada para testes (cada segundo vale 1 minuto para o gráfico ser dinâmico a olho nu)
      // Numa versão final, seria: elapsedTime / 60
      const minutesSpent = elapsedTime;
      
      setActivityData(prev => {
        const newData = [...prev];
        newData[currentDayIndex] += minutesSpent;
        return newData;
      });

      // Optional: Reset timer after saving? No, leave it for the user to see, 
      // or set it to 0 so next check-in is fresh. Let's set it to 0.
      setElapsedTime(0);

    } else {
      setIsTracking(true);
      intervalRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Weekly Stats Labels (fixo de Domingo a Sábado)
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const todayIndex = new Date().getDay();


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

        {/* PROGRESS MOCK */}
        <View style={styles.progressSection}>
          <Text style={styles.sectionOverline}>MONTHLY PROGRESS</Text>
          <Text style={[styles.titleLine, { color: THEME.textPrimary }]}>
            You're crushing
          </Text>
          <Text style={[styles.titleLine, { color: THEME.textPrimary }]}>
            the <Text style={{ color: COLORS.neonBlue, fontStyle: 'italic' }}>Kinetic</Text> pace.
          </Text>
          <Text style={styles.progressDesc}>
            14 out of 20 sessions completed this month. Keep the momentum high.
          </Text>
        </View>

        <View style={styles.efficiencyCircle}>
          <View style={styles.ringOuter}>
            <View style={styles.ringInner}>
              <Text style={styles.effValue}>70<Text style={{ fontSize: 20 }}>%</Text></Text>
              <Text style={styles.effLabel}>EFFICIENCY</Text>
            </View>
          </View>
        </View>

        {/* CHECK-IN CARD */}
        <View style={styles.checkinCard}>
          <Text style={styles.checkinIcon}>{isTracking ? '⏱️' : '☑'}</Text>
          <Text style={styles.checkinTitle}>{isTracking ? 'Workout in progress' : 'Check-in Now'}</Text>
          <Text style={[styles.checkinDesc, isTracking && { fontSize: 32, fontWeight: 'bold', color: '#FFF' }]}>
            {isTracking ? formatTime(elapsedTime) : 'Log sua sessão para o ranking.'}
          </Text>
          <TouchableOpacity 
            style={[styles.startWorkoutBtn, isTracking && { backgroundColor: '#FF3B30' }]} 
            onPress={handleToggleWorkout}
          >
            <Text style={[styles.startWorkoutText, isTracking && { color: '#FFF' }]}>
              {isTracking ? 'STOP WORKOUT' : 'INICIAR TEMPO'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* KINECT LIDERSHIP (LEADERBOARD) */}
        <View style={styles.routineHeader}>
          <View>
            <Text style={styles.routineTitle}>KINECT LIDERSHIP</Text>
            <Text style={styles.routineSub}>Competição semanal de tempo na arena.</Text>
          </View>
        </View>

        <View style={[styles.leaderboardCard, { backgroundColor: THEME.card }]}>
          {LEADERS.map((ldr, index) => (
            <View key={ldr.id} style={[styles.leaderRow, index !== LEADERS.length - 1 && styles.leaderBorder]}>
              <View style={styles.leaderRankCol}>
                <Text style={[styles.leaderRankTxt, ldr.rank <= 3 && { color: ldr.medal }]}>
                  {ldr.rank}º
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

        {/* WEEKLY ACTIVITY GRAPH */}
        <View style={[styles.statsCard, { backgroundColor: THEME.card }]}>
          <Text style={styles.statsLabel}>WEEKLY ACTIVITY (MINUTES)</Text>
          
          <View style={styles.chartContainer}>
            {activityData.map((val, idx) => {
              const maxVal = Math.max(...activityData, 60); // min 60 para não quebrar a escala caso td seja 0
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
