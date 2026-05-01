import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeContext } from '../../contexts/ThemeContext';
import { AuthContext } from '../../contexts/AuthContext';
import { COLORS } from '../../theme/colors';
import HeaderLogo from '../../components/HeaderLogo';
import CustomInput from '../../components/CustomInput';
import PrimaryButton from '../../components/PrimaryButton';
import api from '../../services/api';

export default function OnboardingScreen() {
  const { isDarkMode } = useContext(ThemeContext);
  const { completeOnboarding } = useContext(AuthContext);
  const isDark = isDarkMode;

  const [isLoading, setIsLoading] = useState(false);

  // Campos de captura fisiológica
  const [birthDate, setBirthDate] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [selectedGoal, setSelectedGoal] = useState('Ganho de Massa');
  const [selectedFrequency, setSelectedFrequency] = useState(4);
  const [selectedLevel, setSelectedLevel] = useState('Intermediário');

  const levels = [
    { id: 'Iniciante', desc: 'Estou começando minha jornada agora.', icon: '☻' },
    { id: 'Intermediário', desc: 'Já treino há alguns meses com consistência.', icon: '⤡' },
    { id: 'Pro', desc: 'Anos de experiência e técnica refinada.', icon: '⚡' },
  ];

  const goals = [
    { id: 'Ganho de Massa', icon: '💪' },
    { id: 'Perda de Gordura', icon: '🔥' },
    { id: 'Performance', icon: '🏆' },
  ];

  const frequencies = [3, 4, 5, 6];

  // Formata o input da data automaticamente (DD/MM/AAAA)
  const handleBirthDateChange = (text) => {
    const cleaned = text.replace(/\D/g, '');
    let formatted = cleaned;
    if (cleaned.length > 2) formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    if (cleaned.length > 4) formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4) + '/' + cleaned.slice(4, 8);
    setBirthDate(formatted);
  };

  // Converte DD/MM/AAAA para AAAA-MM-DD (ISO format para o backend)
  const parseToISO = (dateStr) => {
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    const [day, month, year] = parts;
    if (day.length !== 2 || month.length !== 2 || year.length !== 4) return null;
    return `${year}-${month}-${day}`;
  };

  const handleGenerate = async () => {
    // Validações
    const isoDate = parseToISO(birthDate);
    if (!isoDate) {
      Alert.alert('Dado inválido', 'Insira sua data de nascimento no formato DD/MM/AAAA.');
      return;
    }
    if (!weight || isNaN(Number(weight)) || Number(weight) <= 0) {
      Alert.alert('Dado inválido', 'Insira um peso válido em kg.');
      return;
    }
    if (!height || isNaN(Number(height)) || Number(height) <= 0) {
      Alert.alert('Dado inválido', 'Insira uma altura válida em cm.');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/workouts/generate', {
        birthDate: isoDate,
        weight: parseFloat(weight),
        height: parseFloat(height),
        goal: selectedGoal,
        frequency: selectedFrequency,
        level: selectedLevel.toUpperCase(),
      });

      await completeOnboarding({ level: selectedLevel.toUpperCase() });
    } catch (e) {
      const message = e.response?.data || 'Erro ao gerar treino. Tente novamente.';
      Alert.alert('Erro', typeof message === 'string' ? message : 'Falha ao comunicar com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? COLORS.darkBackground : COLORS.lightBackground }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <HeaderLogo />
        
        <Text style={styles.badge}>✨ ONBOARDING</Text>
        
        <View style={styles.titleContainer}>
          <Text style={[styles.titleLine1, { color: isDark ? COLORS.textPrimaryDark : COLORS.textPrimaryLight }]}>
            A Mágica
          </Text>
          <Text style={styles.titleLine2}>
            da IA
          </Text>
        </View>
        
        <Text style={[styles.subtitle, { color: isDark ? COLORS.textSecondaryDark : COLORS.textSecondaryLight }]}>
          Personalização extrema para resultados reais. Insira seus dados para que nossa inteligência crie seu protocolo único.
        </Text>

        <View style={styles.formContainer}>
          <CustomInput 
            label="DATA DE NASCIMENTO" 
            placeholder="DD/MM/AAAA" 
            value={birthDate}
            onChangeText={handleBirthDateChange}
          />
          <CustomInput 
            label="PESO (KG)" 
            placeholder="78" 
            value={weight}
            onChangeText={setWeight}
          />
          <CustomInput 
            label="ALTURA (CM)" 
            placeholder="175" 
            value={height}
            onChangeText={setHeight}
          />
          
          {/* OBJETIVO */}
          <Text style={styles.sectionTitle}>OBJETIVO</Text>
          <View style={styles.chipRow}>
            {goals.map((g) => (
              <TouchableOpacity
                key={g.id}
                style={[
                  styles.chip,
                  { backgroundColor: isDark ? COLORS.darkCard : COLORS.lightCard },
                  selectedGoal === g.id && { borderColor: COLORS.neonBlue, borderWidth: 1.5 },
                ]}
                onPress={() => setSelectedGoal(g.id)}
              >
                <Text style={styles.chipIcon}>{g.icon}</Text>
                <Text style={[styles.chipText, { color: isDark ? '#FFF' : '#000' }]}>{g.id}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* FREQUÊNCIA SEMANAL */}
          <Text style={styles.sectionTitle}>FREQUÊNCIA SEMANAL</Text>
          <View style={styles.frequencyRow}>
            {frequencies.map((f) => (
              <TouchableOpacity
                key={f}
                style={[
                  styles.frequencyChip,
                  { backgroundColor: isDark ? COLORS.darkCard : COLORS.lightCard },
                  selectedFrequency === f && { backgroundColor: COLORS.neonBlue },
                ]}
                onPress={() => setSelectedFrequency(f)}
              >
                <Text style={[
                  styles.frequencyText,
                  selectedFrequency === f && { color: '#000', fontWeight: '900' },
                ]}>
                  {f}x
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* NÍVEL DE EXPERIÊNCIA */}
          <Text style={styles.sectionTitle}>NÍVEL DE EXPERIÊNCIA</Text>
          
          {levels.map((lvl) => (
            <TouchableOpacity 
              key={lvl.id}
              style={[
                styles.levelCard, 
                { backgroundColor: isDark ? COLORS.darkCard : COLORS.lightCard },
                selectedLevel === lvl.id && { borderColor: COLORS.neonBlue, borderWidth: 1 }
              ]}
              onPress={() => setSelectedLevel(lvl.id)}
            >
              <Text style={styles.levelIcon}>{lvl.icon}</Text>
              <View>
                <Text style={[styles.levelTitle, { color: isDark ? '#FFF' : '#000' }]}>{lvl.id}</Text>
                <Text style={styles.levelDesc}>{lvl.desc}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footerCTA}>
          <Text style={styles.ctaTitle}>PRONTO PARA A EVOLUÇÃO?</Text>
          <PrimaryButton 
            title="GERAR TREINO COM IA  ⟩" 
            onPress={handleGenerate} 
            isLoading={isLoading}
          />
          <TouchableOpacity onPress={() => completeOnboarding({ level: selectedLevel.toUpperCase() })} style={styles.skipBtn}>
            <Text style={styles.skipText}>NÃO, JÁ POSSUO TREINO  ✕</Text>
          </TouchableOpacity>
          <Text style={styles.neuralText}>PROCESSAMENTO NEURAL EM TEMPO REAL</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40, flexGrow: 1 },
  badge: {
    color: '#00E5FF',
    fontWeight: 'bold',
    letterSpacing: 1,
    fontSize: 10,
    marginTop: 16,
  },
  titleContainer: { marginTop: 8, marginBottom: 16 },
  titleLine1: {
    fontSize: 40,
    fontWeight: '900',
    lineHeight: 45,
  },
  titleLine2: {
    fontSize: 40,
    fontStyle: 'italic',
    fontWeight: '900',
    lineHeight: 45,
    color: COLORS.neonBlue
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  formContainer: {
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#888',
    marginBottom: 16,
    letterSpacing: 1,
    marginTop: 8,
  },
  // Chips para Objetivo
  chipRow: {
    flexDirection: 'column',
    gap: 10,
    marginBottom: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  chipText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  // Chips para Frequência
  frequencyRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  frequencyChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  frequencyText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#888',
  },
  // Cards de Nível
  levelCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent'
  },
  levelIcon: {
    fontSize: 20,
    color: COLORS.neonBlue,
    marginRight: 16,
  },
  levelTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  levelDesc: {
    color: '#888',
    fontSize: 12,
  },
  footerCTA: {
    marginTop: 40,
    alignItems: 'center',
  },
  ctaTitle: {
    color: '#FFF',
    fontStyle: 'italic',
    fontWeight: '800',
    marginBottom: 16,
    letterSpacing: 1,
  },
  skipBtn: {
    marginTop: 20,
    padding: 10,
  },
  skipText: {
    color: '#888',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  neuralText: {
    color: '#444',
    fontSize: 10,
    letterSpacing: 2,
    marginTop: 16,
  }
});
