import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeContext } from '../../contexts/ThemeContext';
import { AuthContext } from '../../contexts/AuthContext';
import { COLORS } from '../../theme/colors';
import HeaderLogo from '../../components/HeaderLogo';
import CustomInput from '../../components/CustomInput';
import PrimaryButton from '../../components/PrimaryButton';

export default function OnboardingScreen() {
  const { isDarkMode } = useContext(ThemeContext);
  const { completeOnboarding } = useContext(AuthContext);
  const isDark = isDarkMode;

  const [isLoading, setIsLoading] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState('Intermediário');

  const levels = [
    { id: 'Iniciante', desc: 'Estou começando minha jornada agora.', icon: '☻' },
    { id: 'Intermediário', desc: 'Já treino há alguns meses com consistência.', icon: '⤡' },
    { id: 'Pro', desc: 'Anos de experiência e técnica refinada.', icon: '⚡' },
  ];

  const handleGenerate = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      completeOnboarding();
    }, 2000);
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
          <CustomInput label="IDADE" placeholder="25                      anos" />
          <CustomInput label="PESO" placeholder="78                          kg" />
          <CustomInput label="ALTURA" placeholder="175                        cm" />
          
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
          <TouchableOpacity onPress={completeOnboarding} style={styles.skipBtn}>
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
