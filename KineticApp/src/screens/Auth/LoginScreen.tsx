import React, { useContext, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Text, TextInput } from '../../components/ui/scaled';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../../contexts/AuthContext';
import Svg, { Path } from 'react-native-svg';
import { showAlert } from '../../components/ui/AlertHost';
import KeyboardAvoider from '../../components/ui/KeyboardAvoider';
import { KINETIC } from '../../theme/kinetic';
import { BackArrowIcon, EmailIcon, LockIcon, EyeIcon } from '../../components/auth/AuthIcons';
import type { AuthScreenProps } from '../../navigation/types';

function AppleIcon({ size = 18, color = '#f5f6f7' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
        fill={color}
      />
    </Svg>
  );
}

function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  );
}

type Props = AuthScreenProps<'Login'>;

export default function LoginScreen({ navigation, route }: Props) {
  const { signIn } = useContext(AuthContext);
  const [email, setEmail] = useState(route.params?.email ?? '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0;

  const handleLogin = async () => {
    if (!canSubmit || loading) return;
    setLoading(true);
    const result = await signIn({ email: email.trim(), password });
    setLoading(false);
    if (!result.success) {
      if (result.needsEmailVerification) {
        showAlert('Confirme seu e-mail', result.error, [
          { text: 'Digitar código', onPress: () => navigation.navigate('ConfirmEmail', { email: email.trim() }) },
        ]);
        return;
      }
      showAlert('Erro ao entrar', result.error);
    }
  };

  const handleSocial = (provider: string) => {
    showAlert('Em breve', `Login com ${provider} estará disponível em breve.`);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoider style={styles.kav}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() =>
                // Pós-logout o Login é a rota inicial (pilha vazia atrás): goBack() dispararia
                // o erro "GO_BACK não tratado". Nesse caso vamos para o Welcome.
                navigation.canGoBack() ? navigation.goBack() : navigation.replace('Welcome')
              }
              style={styles.backBtn}
              activeOpacity={0.7}
            >
              <BackArrowIcon />
            </TouchableOpacity>
            <Text style={styles.headerText}>Bem-vindo de volta</Text>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Title */}
            <Text style={styles.title}>
              {'Entrar na\n'}
              <Text style={styles.titleAccent}>Kinetic</Text>
            </Text>

            {/* Social buttons */}
            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialBtn} onPress={() => handleSocial('Apple')} activeOpacity={0.8}>
                <AppleIcon />
                <Text style={styles.socialBtnText}>Apple</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialBtn} onPress={() => handleSocial('Google')} activeOpacity={0.8}>
                <GoogleIcon />
                <Text style={styles.socialBtnText}>Google</Text>
              </TouchableOpacity>
            </View>

            {/* Separator */}
            <View style={styles.separator}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>ou com e-mail</Text>
              <View style={styles.separatorLine} />
            </View>

            {/* Email field */}
            <Text style={styles.fieldLabel}>E-MAIL</Text>
            <View style={styles.inputWrap}>
              <EmailIcon />
              <TextInput
                style={styles.textInput}
                placeholder="nome@email.com"
                placeholderTextColor={KINETIC.placeholder}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password field */}
            <View style={styles.fieldLabelRow}>
              <Text style={styles.fieldLabel}>SENHA</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={styles.forgotText}>Esqueci a senha</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputWrap}>
              <LockIcon />
              <TextInput
                style={styles.textInput}
                placeholder="••••••••"
                placeholderTextColor={KINETIC.placeholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn} activeOpacity={0.7}>
                <EyeIcon closed={showPassword} />
              </TouchableOpacity>
            </View>

            {/* Show password checkbox */}
            <TouchableOpacity style={styles.checkRow} onPress={() => setShowPassword(!showPassword)} activeOpacity={0.7}>
              <View style={[styles.checkbox, showPassword && styles.checkboxChecked]}>
                {showPassword && (
                  <Svg width={10} height={10} viewBox="0 0 24 24">
                    <Path
                      d="M5 12l5 5L20 7"
                      stroke="#001a1f"
                      strokeWidth={3.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                )}
              </View>
              <Text style={styles.checkLabel}>Mostrar senha</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.loginBtn, canSubmit && styles.loginBtnActive]}
              onPress={handleLogin}
              disabled={!canSubmit || loading}
              activeOpacity={0.85}
            >
              <Text style={[styles.loginBtnText, canSubmit && styles.loginBtnTextActive]}>
                {loading ? 'Entrando…' : 'Entrar'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.registerRow} activeOpacity={0.7}>
              <Text style={styles.registerText}>
                Não tem conta?{' '}
                <Text style={styles.registerLink}>Criar conta</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoider>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: KINETIC.bg },
  safe: { flex: 1 },
  kav: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: KINETIC.surface1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 13,
    color: KINETIC.textDim,
    fontWeight: '500',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: KINETIC.text,
    letterSpacing: -1,
    lineHeight: 44,
    marginTop: 12,
    marginBottom: 32,
  },
  titleAccent: {
    color: KINETIC.primary,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: KINETIC.surface1,
    borderWidth: 1,
    borderColor: KINETIC.ghostHi,
  },
  socialBtnText: {
    color: KINETIC.text,
    fontSize: 14,
    fontWeight: '600',
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: KINETIC.ghostHi,
  },
  separatorText: {
    fontSize: 12,
    color: KINETIC.textMuted,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: KINETIC.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '600',
    color: KINETIC.primary,
  },
  inputWrap: {
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
  textInput: {
    flex: 1,
    fontSize: 15,
    color: KINETIC.text,
    padding: 0,
  },
  eyeBtn: {
    padding: 4,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: KINETIC.ghostHi,
    backgroundColor: KINETIC.surface1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: KINETIC.primary,
    borderColor: KINETIC.primary,
  },
  checkLabel: {
    fontSize: 13,
    color: KINETIC.textDim,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 12,
  },
  loginBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: KINETIC.surface1,
    borderWidth: 1,
    borderColor: KINETIC.ghostHi,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  },
  loginBtnActive: {
    opacity: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  loginBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: KINETIC.textDim,
  },
  loginBtnTextActive: {
    color: KINETIC.text,
  },
  registerRow: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  registerText: {
    fontSize: 13,
    color: KINETIC.textDim,
  },
  registerLink: {
    color: KINETIC.primary,
    fontWeight: '600',
  },
});
