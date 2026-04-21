import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ExerciseCard({ exercise, isDarkMode }) {
  // Currently building only the layout skeleton with flexbox.
  // Colors and visual styling will be added later based on the design/mockup.
  return (
    <View style={[
      styles.card,
      isDarkMode ? styles.cardDark : styles.cardLight
    ]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, isDarkMode ? styles.textDark : styles.textLight]}>
          {exercise.name}
        </Text>
      </View>
      
      <View style={styles.statsRow}>
        <View style={styles.statColumn}>
          <Text style={[styles.statLabel, isDarkMode ? styles.textMutedDark : styles.textMutedLight]}>Sets/Reps</Text>
          <Text style={[styles.statValue, isDarkMode ? styles.textDark : styles.textLight]}>{exercise.sets} x {exercise.reps}</Text>
        </View>
        <View style={styles.statColumn}>
          <Text style={[styles.statLabel, isDarkMode ? styles.textMutedDark : styles.textMutedLight]}>Weight</Text>
          <Text style={[styles.statValue, isDarkMode ? styles.textDark : styles.textLight]}>{exercise.weight}</Text>
        </View>
        <View style={styles.statColumn}>
          <Text style={[styles.statLabel, isDarkMode ? styles.textMutedDark : styles.textMutedLight]}>Rest</Text>
          <Text style={[styles.statValue, isDarkMode ? styles.textDark : styles.textLight]}>{exercise.restTime}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1, // Optional: border to define limits until mockup arrives
  },
  cardDark: {
    backgroundColor: '#1E1E1E',
    borderColor: '#333',
  },
  cardLight: {
    backgroundColor: '#FFF',
    borderColor: '#E0E0E0',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statColumn: {
    flex: 1,
    alignItems: 'flex-start',
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  textDark: { color: '#FFF' },
  textLight: { color: '#000' },
  textMutedDark: { color: '#AAA' },
  textMutedLight: { color: '#666' }
});
