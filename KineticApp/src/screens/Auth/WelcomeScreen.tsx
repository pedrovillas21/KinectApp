import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Path, Circle, LinearGradient, Defs, Stop } from 'react-native-svg';

// ─── Design tokens (espelham auth.jsx) ──────────────────────────────────────
const A = {
  bg: '#131313',
  s1: '#1c1b1b',
  s2: '#2a2a2a',
  primary: '#00E5FF',
  primarySoft: 'rgba(0,229,255,0.22)',
  primaryDim: 'rgba(0,229,255,0.08)',
  text: '#f5f6f7',
  text2: 'rgba(245,246,247,0.60)',
  text3: 'rgba(245,246,247,0.34)',
  ghostHi: 'rgba(255,255,255,0.13)',
  font: 'System',
};

const FEATURES = [
  'Treinos gerados por IA, calibrados para você',
  'Progressão automática de carga e volume',
  'Anamnese profunda para resultados reais',
];

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

// Ícone de raio (bolt) inline
function BoltIcon({ size = 20, color = '#00161a' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckIcon() {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12l5 5L20 7"
        stroke="#00E5FF"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      {/* Glow orb */}
      <View style={styles.glowOrb} />

      <SafeAreaView style={styles.safe}>
        {/* Hero area */}
        <View style={styles.hero}>
          {/* Logo mark */}
          <View style={styles.logoWrap}>
            <BoltIcon size={36} color="#00161a" />
          </View>

          {/* Wordmark */}
          <Text style={styles.wordmark}>KINETIC</Text>
          <Text style={styles.tagline}>
            O protocolo de treino que evolui com você.
          </Text>

          {/* Feature list */}
          <View style={styles.featureList}>
            {FEATURES.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <CheckIcon />
                </View>
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Bottom CTAs */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.85}
          >
            <BoltIcon size={18} color="#00161a" />
            <Text style={styles.primaryBtnText}>Criar conta grátis</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryBtnText}>Já tenho conta · Entrar</Text>
          </TouchableOpacity>

          <Text style={styles.terms}>
            Ao criar conta, você concorda com os{' '}
            <Text style={styles.termsLink}>Termos de Uso</Text>
            {' '}e{' '}
            <Text style={styles.termsLink}>Privacidade</Text>.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: A.bg,
  },
  safe: {
    flex: 1,
  },
  glowOrb: {
    position: 'absolute',
    top: -80,
    left: '50%',
    marginLeft: -170,
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: 'rgba(0,229,255,0.07)',
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 20,
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: A.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: A.primary,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 12,
  },
  wordmark: {
    fontFamily: A.font,
    fontWeight: '900',
    fontSize: 42,
    color: A.text,
    letterSpacing: -2,
    marginBottom: 10,
  },
  tagline: {
    fontFamily: A.font,
    fontSize: 15,
    color: A.text2,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 260,
    marginBottom: 36,
  },
  featureList: {
    alignSelf: 'stretch',
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    width: 22,
    height: 22,
    borderRadius: 8,
    backgroundColor: A.primaryDim,
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureText: {
    fontFamily: A.font,
    fontSize: 13,
    color: A.text2,
    lineHeight: 20,
    flex: 1,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 12,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 17,
    borderRadius: 16,
    backgroundColor: A.primary,
    shadowColor: A.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  primaryBtnText: {
    fontFamily: A.font,
    fontWeight: '800',
    fontSize: 16,
    color: '#00161a',
    letterSpacing: 0.2,
  },
  secondaryBtn: {
    paddingVertical: 17,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: A.ghostHi,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontFamily: A.font,
    fontWeight: '700',
    fontSize: 16,
    color: A.text,
  },
  terms: {
    fontFamily: A.font,
    fontSize: 11,
    color: A.text3,
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 4,
  },
  termsLink: {
    color: A.text2,
    textDecorationLine: 'underline',
  },
});
