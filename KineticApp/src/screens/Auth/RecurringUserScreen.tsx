import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { Text, TextInput } from '../../components/ui/scaled';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import Svg, { Path, Circle } from 'react-native-svg';
import { AuthContext } from '../../contexts/AuthContext';
import { showAlert } from '../../components/ui/AlertHost';
import KeyboardAvoider from '../../components/ui/KeyboardAvoider';
import { KINETIC } from '../../theme/kinetic';
import { LockIcon, EyeIcon } from '../../components/auth/AuthIcons';
import type { AuthScreenProps } from '../../navigation/types';

type SecurityState = 'loading' | 'none' | 'pin' | 'biometric';
type BiometricState = 'idle' | 'scanning' | 'success' | 'error';

type Props = AuthScreenProps<'RecurringUser'>;

function FaceIcon({ color = KINETIC.primary, size = 40 }: { color?: string; size?: number }) {
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

/** Iniciais das duas primeiras palavras do nome; sem nome, a 1ª letra do e-mail. */
function initialsFor(user: { nome?: string; email?: string } | null): string {
  if (user?.nome) {
    return user.nome
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }
  if (user?.email) return user.email[0].toUpperCase();
  return '?';
}

/** Título e subtítulo de cada estado da biometria (o título de "idle" depende do tipo). */
const BIO_COPY: Record<BiometricState, { title?: string; subtitle: string }> = {
  idle: { subtitle: 'Toque no ícone para autenticar' },
  scanning: { title: 'Verificando…', subtitle: 'Olhe para o dispositivo' },
  success: { title: 'Identidade confirmada', subtitle: 'Abrindo seu protocolo…' },
  error: { title: 'Não reconhecido', subtitle: 'Tente novamente ou use sua senha' },
};

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
      if (result.needsEmailVerification) {
        showAlert('Confirme seu e-mail', result.error, [
          {
            text: 'Digitar código',
            onPress: () => navigation.navigate('ConfirmEmail', { email: rememberedUser?.email ?? '' }),
          },
        ]);
        return;
      }
      showAlert('Erro ao entrar', result.error);
    }
  };

  const initials = initialsFor(rememberedUser);

  const displayName = rememberedUser?.nome || rememberedUser?.email?.split('@')[0] || '—';

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
        <KeyboardAvoider style={styles.kav}
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
          </View>

          {/* Biometric area */}
          <View style={styles.biometricArea}>
            {security === 'loading' ? (
              <ActivityIndicator color={KINETIC.primary} size="large" />
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
                      color={bioState === 'error' ? '#FF4444' : KINETIC.primary}
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
                    bioState === 'success' && { color: KINETIC.primary },
                    bioState === 'error' && { color: '#FF4444' },
                  ]}
                >
                  {BIO_COPY[bioState].title ??
                    (security === 'biometric' ? 'Entrar com Face ID' : 'Entrar com PIN')}
                </Text>
                <Text style={styles.bioSubtitle}>{BIO_COPY[bioState].subtitle}</Text>
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
                    placeholderTextColor={KINETIC.placeholder}
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
        </KeyboardAvoider>
      </SafeAreaView>
    </View>
  );
}

const RING_SIZE = 130;
const CENTER_SIZE = RING_SIZE - 28;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KINETIC.bg,
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
    color: KINETIC.textMuted,
  },
  switchBtn: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '600',
    color: KINETIC.textDim,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginHorizontal: 24,
    marginTop: 4,
    padding: 14,
    backgroundColor: KINETIC.surface1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: KINETIC.ghostHi,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: KINETIC.primary,
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
    color: KINETIC.text,
    letterSpacing: -0.3,
  },
  cardEmail: {
    fontFamily: 'System',
    fontSize: 12,
    color: KINETIC.textDim,
    marginTop: 2,
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
    borderColor: KINETIC.primary,
  },
  ringDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: KINETIC.primary,
    marginLeft: -4,
    marginTop: -4,
    alignSelf: 'center',
  },
  ringCenter: {
    width: CENTER_SIZE,
    height: CENTER_SIZE,
    borderRadius: CENTER_SIZE / 2,
    backgroundColor: KINETIC.surface1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenterSuccess: {
    backgroundColor: KINETIC.primary,
    shadowColor: KINETIC.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  bioTitle: {
    fontFamily: 'System',
    fontWeight: '700',
    fontSize: 18,
    color: KINETIC.text,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  bioSubtitle: {
    fontFamily: 'System',
    fontSize: 13,
    color: KINETIC.textDim,
    textAlign: 'center',
  },
  noSecurityMsg: {
    fontFamily: 'System',
    fontSize: 14,
    color: KINETIC.textDim,
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
    backgroundColor: KINETIC.surface2,
    borderWidth: 1,
    borderColor: KINETIC.ghostHi,
    marginBottom: 0,
  },
  fallbackText: {
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '600',
    color: KINETIC.textDim,
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
    backgroundColor: KINETIC.surface1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: KINETIC.ghostHi,
    paddingHorizontal: 14,
    height: 52,
  },
  inlineInput: {
    flex: 1,
    fontSize: 15,
    color: KINETIC.text,
    padding: 0,
  },
  eyeBtn: {
    padding: 4,
  },
  inlineLoginBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: KINETIC.surface1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineLoginBtnDisabled: {
    opacity: 0.45,
    borderColor: KINETIC.ghostHi,
  },
  inlineLoginBtnText: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '700',
    color: KINETIC.text,
  },
});
