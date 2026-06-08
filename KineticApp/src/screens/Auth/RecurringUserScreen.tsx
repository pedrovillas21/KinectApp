import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Path, Circle } from 'react-native-svg';
import { AuthContext } from '../../contexts/AuthContext';

// ─── Design tokens ───────────────────────────────────────────────────────────
const A = {
  bg: '#131313',
  s1: '#1c1b1b',
  s2: '#2a2a2a',
  primary: '#00E5FF',
  primarySoft: 'rgba(0,229,255,0.22)',
  primaryDim: 'rgba(0,229,255,0.08)',
  gold: '#ffeac0',
  goldDim: 'rgba(255,234,192,0.08)',
  goldBorder: 'rgba(255,234,192,0.15)',
  text: '#f5f6f7',
  text2: 'rgba(245,246,247,0.60)',
  text3: 'rgba(245,246,247,0.34)',
  ghostHi: 'rgba(255,255,255,0.13)',
};

type SecurityState = 'loading' | 'none' | 'pin' | 'biometric';
type BiometricState = 'idle' | 'scanning' | 'success' | 'error';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

function FaceIcon({ color = A.primary, size = 40 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 3H5a2 2 0 00-2 2v2M17 3h2a2 2 0 012 2v2M7 21H5a2 2 0 01-2-2v-2M17 21h2a2 2 0 002-2v-2"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={9} cy={10} r={1.2} fill={color} />
      <Circle cx={15} cy={10} r={1.2} fill={color} />
      <Path
        d="M9 15s1 1.5 3 1.5 3-1.5 3-1.5"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckIcon({ size = 36 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12l5 5L20 7"
        stroke="#001a1f"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LockIcon({ size = 16, color = A.text3 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7 11V7a5 5 0 0110 0v4"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function EyeIcon({ size = 18, color = A.text3, closed = false }: { size?: number; color?: string; closed?: boolean }) {
  if (closed) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M1 1l22 22"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={1.5} />
    </Svg>
  );
}

export default function RecurringUserScreen({ navigation }: Props) {
  const { rememberedUser, unlockSession, signIn } = useContext(AuthContext);

  const [security, setSecurity] = useState<SecurityState>('loading');
  const [bioState, setBioState] = useState<BiometricState>('idle');
  const [unlocking, setUnlocking] = useState(false);

  const [showPasswordMode, setShowPasswordMode] = useState(false);
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // Rotation for scanning ring
  const rotation = useState(new Animated.Value(0))[0];
  const scanAnim = Animated.loop(
    Animated.timing(rotation, {
      toValue: 1,
      duration: 1000,
      easing: Easing.linear,
      useNativeDriver: true,
    }),
  );

  useEffect(() => {
    (async () => {
      const level = await LocalAuthentication.getEnrolledLevelAsync();
      if (level === LocalAuthentication.SecurityLevel.NONE) {
        setSecurity('none');
      } else if (level === LocalAuthentication.SecurityLevel.SECRET) {
        setSecurity('pin');
      } else {
        setSecurity('biometric');
      }
    })();
  }, []);

  useEffect(() => {
    if (bioState === 'scanning') {
      scanAnim.start();
    } else {
      scanAnim.stop();
      rotation.setValue(0);
    }
  }, [bioState]);

  const handleBiometricUnlock = async () => {
    if (unlocking) return;
    setBioState('scanning');
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirme sua identidade para entrar',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setBioState('success');
        setUnlocking(true);
        await unlockSession();
      } else {
        setBioState('error');
        setTimeout(() => setBioState('idle'), 2000);
      }
    } catch {
      setBioState('error');
      setTimeout(() => setBioState('idle'), 2000);
    } finally {
      setUnlocking(false);
    }
  };

  const handleInlineLogin = async () => {
    if (loginLoading || !password) return;
    setLoginLoading(true);
    const result = await signIn({ email: rememberedUser?.email ?? '', password });
    setLoginLoading(false);
    if (!result.success) {
      Alert.alert('Erro ao entrar', result.error);
    }
  };

  const initials = rememberedUser?.nome
    ? rememberedUser.nome
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : rememberedUser?.email
    ? rememberedUser.email[0].toUpperCase()
    : '?';

  const displayName = rememberedUser?.nome || rememberedUser?.email?.split('@')[0] || '—';

  const ringColor =
    bioState === 'success'
      ? A.primary
      : bioState === 'error'
      ? '#FF4444'
      : A.primary;

  const rotateStyle = {
    transform: [
      {
        rotate: rotation.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        }),
      },
    ],
  };

  return (
    <View style={styles.container}>
      {/* Ambient glow at bottom */}
      <View
        style={[
          styles.glowOrb,
          bioState === 'success' && styles.glowOrbActive,
          bioState === 'scanning' && styles.glowOrbScan,
        ]}
      />

      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kav}
          enabled={showPasswordMode}
        >
          {/* Header: label + trocar conta */}
          <View style={styles.header}>
            <Text style={styles.headerLabel}>CONTA ATIVA</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.switchBtn}>Trocar conta</Text>
            </TouchableOpacity>
          </View>

          {/* User card */}
          <View style={styles.card}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{displayName}</Text>
              <Text style={styles.cardEmail}>{rememberedUser?.email}</Text>
            </View>
            {rememberedUser?.streak != null && (
              <View style={styles.streakBadge}>
                <Text style={styles.streakEmoji}>🔥</Text>
                <Text style={styles.streakCount}>{rememberedUser.streak}</Text>
              </View>
            )}
          </View>

          {/* Biometric area */}
          <View style={styles.biometricArea}>
            {security === 'loading' ? (
              <ActivityIndicator color={A.primary} size="large" />
            ) : security === 'none' ? (
              <Text style={styles.noSecurityMsg}>
                Nenhuma biometria ou PIN configurado.{'\n'}Use e-mail e senha.
              </Text>
            ) : (
              <TouchableOpacity
                style={styles.ringWrap}
                onPress={handleBiometricUnlock}
                activeOpacity={0.8}
                disabled={bioState === 'scanning' || bioState === 'success'}
              >
                {/* Outer ring track */}
                <View style={styles.ringTrack} />

                {/* Animated scanning ring */}
                {bioState === 'scanning' && (
                  <Animated.View style={[styles.ringIndicator, rotateStyle]}>
                    <View style={styles.ringDot} />
                  </Animated.View>
                )}

                {/* Success ring */}
                {bioState === 'success' && (
                  <View style={[styles.ringIndicator, styles.ringIndicatorFull]} />
                )}

                {/* Center icon */}
                <View
                  style={[
                    styles.ringCenter,
                    bioState === 'success' && styles.ringCenterSuccess,
                  ]}
                >
                  {bioState === 'success' ? (
                    <CheckIcon size={36} />
                  ) : (
                    <FaceIcon
                      size={40}
                      color={bioState === 'error' ? '#FF4444' : A.primary}
                    />
                  )}
                </View>
              </TouchableOpacity>
            )}

            {/* State label */}
            {security !== 'loading' && security !== 'none' && (
              <>
                <Text
                  style={[
                    styles.bioTitle,
                    bioState === 'success' && { color: A.primary },
                    bioState === 'error' && { color: '#FF4444' },
                  ]}
                >
                  {bioState === 'idle' &&
                    (security === 'biometric' ? 'Entrar com Face ID' : 'Entrar com PIN')}
                  {bioState === 'scanning' && 'Verificando…'}
                  {bioState === 'success' && 'Identidade confirmada'}
                  {bioState === 'error' && 'Não reconhecido'}
                </Text>
                <Text style={styles.bioSubtitle}>
                  {bioState === 'idle' && 'Toque no ícone para autenticar'}
                  {bioState === 'scanning' && 'Olhe para o dispositivo'}
                  {bioState === 'success' && 'Abrindo seu protocolo…'}
                  {bioState === 'error' && 'Tente novamente ou use sua senha'}
                </Text>
              </>
            )}
          </View>

          {/* Fallback / inline password section */}
          <View style={styles.fallback}>
            {/* Toggle button: "Usar e-mail e senha" / "Ocultar" */}
            <TouchableOpacity
              onPress={() => {
                setShowPasswordMode(!showPasswordMode);
                setPassword('');
              }}
              style={styles.fallbackBtn}
            >
              <Text style={styles.fallbackText}>
                {showPasswordMode ? 'Ocultar' : 'Usar e-mail e senha'}
              </Text>
            </TouchableOpacity>

            {/* Inline password fields */}
            {showPasswordMode && (
              <View style={styles.passwordSection}>
                <View style={styles.inlineInputWrap}>
                  <LockIcon />
                  <TextInput
                    style={styles.inlineInput}
                    placeholder="Senha"
                    placeholderTextColor={A.text3}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPwd}
                    autoFocus
                  />
                  <TouchableOpacity onPress={() => setShowPwd(!showPwd)} style={styles.eyeBtn} activeOpacity={0.7}>
                    <EyeIcon closed={!showPwd} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.inlineLoginBtn, (!password || loginLoading) && styles.inlineLoginBtnDisabled]}
                  onPress={handleInlineLogin}
                  disabled={!password || loginLoading}
                  activeOpacity={0.85}
                >
                  <Text style={styles.inlineLoginBtnText}>
                    {loginLoading ? 'Entrando…' : 'Entrar'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const RING_SIZE = 130;
const CENTER_SIZE = RING_SIZE - 28;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: A.bg,
  },
  safe: {
    flex: 1,
  },
  kav: {
    flex: 1,
  },
  glowOrb: {
    position: 'absolute',
    bottom: -100,
    left: '50%',
    marginLeft: -160,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(0,229,255,0.05)',
  },
  glowOrbActive: {
    backgroundColor: 'rgba(0,229,255,0.15)',
  },
  glowOrbScan: {
    backgroundColor: 'rgba(0,229,255,0.08)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerLabel: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: A.text3,
  },
  switchBtn: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '600',
    color: A.text2,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginHorizontal: 24,
    marginTop: 4,
    padding: 14,
    backgroundColor: A.s1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: A.ghostHi,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: A.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontFamily: 'System',
    fontWeight: '800',
    fontSize: 16,
    color: '#001a1f',
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontFamily: 'System',
    fontWeight: '700',
    fontSize: 16,
    color: A.text,
    letterSpacing: -0.3,
  },
  cardEmail: {
    fontFamily: 'System',
    fontSize: 12,
    color: A.text2,
    marginTop: 2,
  },
  streakBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: A.goldDim,
    borderWidth: 1,
    borderColor: A.goldBorder,
    alignItems: 'center',
  },
  streakEmoji: {
    fontSize: 14,
  },
  streakCount: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '700',
    color: A.gold,
  },
  biometricArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ringTrack: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  ringIndicator: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  ringIndicatorFull: {
    borderWidth: 4,
    borderColor: A.primary,
  },
  ringDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: A.primary,
    marginLeft: -4,
    marginTop: -4,
    alignSelf: 'center',
  },
  ringCenter: {
    width: CENTER_SIZE,
    height: CENTER_SIZE,
    borderRadius: CENTER_SIZE / 2,
    backgroundColor: A.s1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenterSuccess: {
    backgroundColor: A.primary,
    shadowColor: A.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  bioTitle: {
    fontFamily: 'System',
    fontWeight: '700',
    fontSize: 18,
    color: A.text,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  bioSubtitle: {
    fontFamily: 'System',
    fontSize: 13,
    color: A.text2,
    textAlign: 'center',
  },
  noSecurityMsg: {
    fontFamily: 'System',
    fontSize: 14,
    color: A.text2,
    textAlign: 'center',
    lineHeight: 22,
  },
  fallback: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    alignItems: 'center',
    gap: 0,
  },
  fallbackBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: A.s2,
    borderWidth: 1,
    borderColor: A.ghostHi,
    marginBottom: 0,
  },
  fallbackText: {
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '600',
    color: A.text2,
  },
  passwordSection: {
    marginTop: 12,
    width: '100%',
    gap: 10,
  },
  inlineInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: A.s1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: A.ghostHi,
    paddingHorizontal: 14,
    height: 52,
  },
  inlineInput: {
    flex: 1,
    fontSize: 15,
    color: A.text,
    padding: 0,
  },
  eyeBtn: {
    padding: 4,
  },
  inlineLoginBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: A.s1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineLoginBtnDisabled: {
    opacity: 0.45,
    borderColor: A.ghostHi,
  },
  inlineLoginBtnText: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '700',
    color: A.text,
  },
});
