import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../components/ui/scaled';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { FONT, KINETIC } from '../../theme/kinetic';
import { PRIVACY_URL, TERMS_URL, openLegal } from '../../config/legal';
import type { AuthScreenProps } from '../../navigation/types';

type Props = AuthScreenProps<'Welcome'>;

// As três barras da marca, na ordem em que entram.
const BARS = [
  { d: 'M6 0h6L6 20H0z', opacity: 1 },
  { d: 'M15 0h6l-6 20H9z', opacity: 0.55 },
  { d: 'M24 0h2l-6 20h-2z', opacity: 0.25 },
];

const EASE = Easing.bezier(0.2, 0.7, 0.2, 1);

/** Valor que vai de 0 a 1 depois de `delay` ms (ou já em 1 com "reduzir movimento"). */
function useEntrance(delay: number, duration: number, reduceMotion: boolean | null) {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduceMotion === null) return;
    if (reduceMotion) {
      value.setValue(1);
      return;
    }
    Animated.timing(value, { toValue: 1, duration, delay, easing: EASE, useNativeDriver: true }).start();
  }, [value, delay, duration, reduceMotion]);
  return value;
}

/** Tela de entrada: a marca e o caminho para entrar ou criar conta, sem propaganda. */
export default function WelcomeScreen({ navigation }: Props) {
  const [reduceMotion, setReduceMotion] = React.useState<boolean | null>(null);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduceMotion)
      .catch(() => setReduceMotion(false));
  }, []);

  const bar0 = useEntrance(50, 500, reduceMotion);
  const bar1 = useEntrance(150, 500, reduceMotion);
  const bar2 = useEntrance(250, 500, reduceMotion);
  const wordmark = useEntrance(300, 600, reduceMotion);
  const tagline = useEntrance(450, 600, reduceMotion);
  const actions = useEntrance(600, 600, reduceMotion);
  const footer = useEntrance(700, 600, reduceMotion);
  const bars = [bar0, bar1, bar2];

  // Barras grandes ao fundo deslizam devagar, ida e volta.
  const drift = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduceMotion !== false) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 9000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: 9000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [drift, reduceMotion]);

  const rise = (v: Animated.Value) => ({
    opacity: v,
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.backdrop,
          { transform: [{ translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [0, -18] }) }] },
        ]}
      >
        <Svg width={620} height={477} viewBox="0 0 26 20">
          <Path d={BARS[0].d} fill={KINETIC.primary} opacity={0.05} />
          <Path d={BARS[1].d} fill={KINETIC.primary} opacity={0.03} />
          <Path d={BARS[2].d} fill={KINETIC.primary} opacity={0.02} />
        </Svg>
      </Animated.View>

      <SafeAreaView style={styles.safe}>
        <View style={styles.hero}>
          <View style={styles.brand} accessible accessibilityRole="header" accessibilityLabel="Kinetic">
            <View style={styles.mark}>
              {BARS.map((bar, i) => (
                <Animated.View
                  key={bar.d}
                  style={[
                    StyleSheet.absoluteFill,
                    {
                      opacity: bars[i].interpolate({ inputRange: [0, 1], outputRange: [0, bar.opacity] }),
                      transform: [{ translateX: bars[i].interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }],
                    },
                  ]}
                >
                  <Svg width={40} height={31} viewBox="0 0 26 20">
                    <Path d={bar.d} fill={KINETIC.primary} />
                  </Svg>
                </Animated.View>
              ))}
            </View>
            <Animated.Text style={[styles.wordmark, rise(wordmark)]}>KINETIC</Animated.Text>
          </View>
          <Animated.Text style={[styles.tagline, rise(tagline)]}>Treino com método.</Animated.Text>
        </View>

        <View style={styles.bottom}>
          <Animated.View style={[styles.actions, rise(actions)]}>
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('Login')}
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
            >
              <Text style={styles.primaryBtnText}>Entrar</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('Register')}
              style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
            >
              <Text style={styles.secondaryBtnText}>Criar conta</Text>
            </Pressable>
          </Animated.View>

          <Animated.View style={[styles.footer, rise(footer)]}>
            <View style={styles.trust}>
              <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
                  stroke={KINETIC.success}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path d="m9 12 2 2 4-4" stroke={KINETIC.success} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
              <Text style={styles.trustText}>Seus dados protegidos conforme a LGPD</Text>
            </View>
            <Text style={styles.terms}>
              Ao continuar, você concorda com os{' '}
              <Text style={styles.termsLink} onPress={() => openLegal(TERMS_URL)} accessibilityRole="link">
                Termos de Uso
              </Text>{' '}
              e a{' '}
              <Text style={styles.termsLink} onPress={() => openLegal(PRIVACY_URL)} accessibilityRole="link">
                Política de Privacidade
              </Text>
              .
            </Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: KINETIC.bg, overflow: 'hidden' },
  backdrop: { position: 'absolute', top: 150, left: 40 },
  safe: { flex: 1, paddingHorizontal: 24, paddingBottom: 12 },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mark: { width: 40, height: 31 },
  wordmark: { fontFamily: FONT.bold, fontSize: 30, letterSpacing: 1.2, color: KINETIC.text },
  tagline: { fontFamily: FONT.regular, fontSize: 14, color: KINETIC.textDim },
  bottom: { gap: 20 },
  actions: { gap: 10 },
  primaryBtn: {
    height: 52,
    borderRadius: 12,
    backgroundColor: KINETIC.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: KINETIC.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 6,
  },
  primaryBtnText: { fontFamily: FONT.bold, fontSize: 15, color: KINETIC.onPrimary },
  secondaryBtn: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { fontFamily: FONT.semibold, fontSize: 15, color: KINETIC.text },
  pressed: { opacity: 0.85 },
  footer: { alignItems: 'center', gap: 8 },
  trust: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trustText: { fontFamily: FONT.regular, fontSize: 12, color: KINETIC.textDim },
  terms: { fontFamily: FONT.regular, fontSize: 11.5, lineHeight: 17, color: KINETIC.textSecondary, textAlign: 'center' },
  termsLink: { textDecorationLine: 'underline', color: KINETIC.textDim },
});
