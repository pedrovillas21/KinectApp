import React, { useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import { COLORS } from '../theme/colors';
import AppHeader from '../components/AppHeader';

// Mocks for training programs
const ROUTINES = [
  { id: '1', title: 'Push day', bodyParts: 'CHEST / SHOULDERS / TRICEPS', exercises: '12', tag: 'DIA A' },
  { id: '2', title: 'Pull day', bodyParts: 'BACK / BICEPS / CORE', exercises: '10', tag: 'DIA B' },
  { id: '3', title: 'Leg day', bodyParts: 'QUADS / GLUTES / CALVES', exercises: '8', tag: 'DIA C' }
];

export default function HomeScreen({ navigation }) {
  const { isDarkMode } = useContext(ThemeContext);
  const isDark = isDarkMode;

  const THEME = {
    bg: isDark ? COLORS.darkBackground : COLORS.lightBackground,
    textPrimary: isDark ? COLORS.textPrimaryDark : COLORS.textPrimaryLight,
    textSec: isDark ? COLORS.textSecondaryDark : COLORS.textSecondaryLight,
    card: isDark ? COLORS.darkCard : COLORS.lightCard
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: THEME.bg }]}>
      {/* Header FIXO fora do scroll */}
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
            14 out of 20 sessions completed this month. Keep the momentum high.
          </Text>
        </View>

        <View style={styles.efficiencyCircle}>
          {/* Placeholder for the ring */}
          <View style={styles.ringOuter}>
            <View style={styles.ringInner}>
              <Text style={styles.effValue}>70<Text style={{ fontSize: 20 }}>%</Text></Text>
              <Text style={styles.effLabel}>EFFICIENCY</Text>
            </View>
          </View>
        </View>

        <View style={styles.checkinCard}>
          <Text style={styles.checkinIcon}>☑</Text>
          <Text style={styles.checkinTitle}>Check-in Now</Text>
          <Text style={styles.checkinDesc}>Log your current session at the Arena.</Text>
          <TouchableOpacity style={styles.startWorkoutBtn} onPress={() => navigation.navigate('Train')}>
            <Text style={styles.startWorkoutText}>START WORKOUT</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.routineHeader}>
          <View>
            <Text style={styles.routineTitle}>TRAINING ROUTINE</Text>
            <Text style={styles.routineSub}>Your personalized performance blocks.</Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.viewAll}>VIEW ALL</Text>
          </TouchableOpacity>
        </View>

        {ROUTINES.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.programCard}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Train', params: { routineId: item.id } })}
          >
            <View style={[styles.programImageMock, { backgroundColor: THEME.card }]}>
              <View style={styles.tagBadge}>
                <Text style={styles.tagText}>{item.tag}</Text>
              </View>
            </View>
            <View style={styles.programInfo}>
              <View>
                <Text style={styles.progTitle}>{item.title}</Text>
                <Text style={styles.progBodyProps}>{item.bodyParts}</Text>
                <Text style={styles.progExCount}><Text style={{ color: COLORS.neonBlue }}>{item.exercises}</Text> Exercícios</Text>
                <Text style={styles.progVol}>VOLUME</Text>
              </View>
              <View style={styles.playIconContainer}>
                <Text style={styles.playIcon}>▶</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <View style={[styles.statsCard, { backgroundColor: THEME.card }]}>
          <Text style={styles.statsLabel}>LAST SESSION PERFORMANCE</Text>
          <Text style={styles.statsBpm}>94 <Text style={styles.bpmItalic}>bpm</Text></Text>
          <Text style={styles.statsDesc}>Resting Heart Rate Average</Text>

          <View style={styles.dotsRow}>
            {/* Placeholders for graph circles */}
            {[...Array(5)].map((_, i) => (
              <View key={i} style={[styles.dot, i === 3 && styles.dotActive]} />
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  brand: {
    fontSize: 22,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 1,
  },
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
  checkinDesc: { color: COLORS.darkBackground, fontSize: 13, marginBottom: 16 },
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
  routineTitle: { color: '#FFF', fontSize: 16, fontStyle: 'italic', fontWeight: '900', letterSpacing: 1 },
  routineSub: { color: '#888', fontSize: 12, marginTop: 4 },
  viewAll: { color: COLORS.neonBlue, fontSize: 12, fontWeight: 'bold' },
  programCard: {
    marginBottom: 20,
  },
  programImageMock: {
    height: 100,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  tagBadge: {
    backgroundColor: COLORS.neonBlue,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomRightRadius: 8,
    borderTopLeftRadius: 12,
  },
  tagText: { color: COLORS.darkBackground, fontSize: 10, fontWeight: 'bold' },
  programInfo: {
    backgroundColor: '#1C1C1C',
    padding: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  progBodyProps: { color: '#888', fontSize: 10, marginBottom: 12, letterSpacing: 1 },
  progExCount: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  progVol: { color: '#666', fontSize: 10, letterSpacing: 1, marginTop: 2 },
  playIconContainer: {
    backgroundColor: '#333',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: { color: COLORS.neonBlue, fontSize: 12 },
  statsCard: {
    borderRadius: 12,
    padding: 24,
    marginTop: 16,
  },
  statsLabel: { color: '#666', fontSize: 10, letterSpacing: 1, fontWeight: 'bold', marginBottom: 12 },
  statsBpm: { color: '#FFF', fontSize: 40, fontWeight: '900' },
  bpmItalic: { fontSize: 16, fontStyle: 'italic', color: COLORS.neonBlue },
  statsDesc: { color: '#AAA', fontSize: 13, marginTop: 4, marginBottom: 20 },
  dotsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dot: { width: 40, height: 24, borderRadius: 12, backgroundColor: '#333' },
  dotActive: { backgroundColor: COLORS.neonBlue, width: 48 }
});
