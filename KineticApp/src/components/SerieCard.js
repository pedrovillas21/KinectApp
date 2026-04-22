import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { COLORS } from '../theme/colors';

export default function SerieCard({
  setNumber,
  targetReps,
  targetWeight,
  restTime,
  isActive,
  isCompleted,
  weightValue,
  repsValue,
  onWeightChange,
  onRepsChange,
  onToggleComplete
}) {
  
  const cardOuterStyle = [
    styles.card,
    isActive && styles.cardActive,
  ];

  return (
    <View style={styles.outerContainer}>
      <View style={isActive ? styles.activeGlow : styles.inactiveIndicator} />
      <View style={cardOuterStyle}>
        
        {/* CABEÇALHO */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>
            Série {setNumber.toString().padStart(2, '0')}
          </Text>
          
          {(isActive || isCompleted) && (
            <TouchableOpacity 
              style={[styles.checkButton, isCompleted && styles.checkButtonCompleted]}
              onPress={onToggleComplete}
              disabled={!isActive && !isCompleted}
            >
              {isCompleted ? (
                <Text style={styles.checkTextCompleted}>✓</Text>
              ) : (
                <Text style={styles.checkTextActive}>✓</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* TAGS */}
        <View style={styles.tagsRow}>
          <View style={styles.tag}><Text style={styles.tagText}>{targetReps}</Text></View>
          <View style={styles.tag}><Text style={styles.tagText}>{targetWeight}</Text></View>
          <View style={styles.tag}><Text style={styles.tagText}>{restTime}</Text></View>
        </View>

        {/* INPUTS ROW */}
        <View style={styles.inputsRow}>
          <View style={styles.inputCol}>
            <Text style={styles.inputLabel}>PESO REALIZADO (KG)</Text>
            <TextInput
              style={[
                styles.inputBox, 
                isActive ? styles.inputBoxActive : styles.inputBoxInactive
              ]}
              value={weightValue}
              onChangeText={onWeightChange}
              editable={isActive}
              keyboardType="numeric"
              placeholder={isActive ? "0" : "--"}
              placeholderTextColor={isActive ? "#888" : "#555"}
              textAlign="center"
            />
          </View>

          <View style={{ width: 16 }} />

          <View style={styles.inputCol}>
            <Text style={styles.inputLabel}>REPS REALIZADAS</Text>
            <TextInput
              style={[
                styles.inputBox, 
                isActive ? styles.inputBoxActive : styles.inputBoxInactive
              ]}
              value={repsValue}
              onChangeText={onRepsChange}
              editable={isActive}
              keyboardType="numeric"
              placeholder={isActive ? "0" : "--"}
              placeholderTextColor={isActive ? "#888" : "#555"}
              textAlign="center"
            />
          </View>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  activeGlow: {
    width: 4,
    backgroundColor: COLORS.neonBlue,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  inactiveIndicator: {
    width: 4,
    backgroundColor: 'transparent',
  },
  card: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    padding: 20,
    // Add left radius if inactive, so it still looks rounded
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    marginLeft: -4, // pull it back over the indicator space
  },
  cardActive: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    marginLeft: 0,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  checkButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkButtonCompleted: {
    backgroundColor: '#2A2A2A', 
  },
  checkTextCompleted: {
    color: COLORS.neonBlue,
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkTextActive: {
    color: '#666',
    fontSize: 16,
  },
  tagsRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  tag: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  tagText: {
    color: '#888',
    fontSize: 10,
    fontWeight: 'bold',
  },
  inputsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputCol: {
    flex: 1,
  },
  inputLabel: {
    color: '#888',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 8,
  },
  inputBox: {
    height: 52,
    borderRadius: 8,
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  inputBoxActive: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.neonBlue,
  },
  inputBoxInactive: {
    backgroundColor: '#242424', // slightly darker than the card
    color: '#666',
  }
});
