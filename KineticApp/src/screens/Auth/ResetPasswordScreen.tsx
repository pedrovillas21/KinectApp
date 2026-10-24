import React, { useContext, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Text, TextInput } from '../../components/ui/scaled';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { AuthContext } from '../../contexts/AuthContext';
import Svg, { Path, Circle } from 'react-native-svg';
import { showAlert } from '../../components/ui/AlertHost';
import KeyboardAvoider from '../../components/ui/KeyboardAvoider';
import { KINETIC } from '../../theme/kinetic';

const A = {
  bg: '#131313',
  s1: '#1c1b1b',
  primary: '#00E5FF',
  text: '#f5f6f7',
  text2: 'rgba(245,246,247,0.60)',
  text3: 'rgba(245,246,247,0.34)',
  ghostHi: 'rgba(255,255,255,0.13)',
  success: '#4ade80',
};

function BackArrowIcon({ size = 20, color = '#f5f6f7' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M5 12l7 7M5 12l7-7"
        stroke={color}
        strokeWidth={2}
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

function CheckIcon({ size = 10, color = '#001a1f' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M5 12l5 5L20 7"
        stroke={color}
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

type Requirement = { label: string; met: boolean };

function RequirementItem({ label, met }: Requirement) {
  return (
    <View style={reqStyles.row}>
      <View style={[reqStyles.dot, met && reqStyles.dotMet]}>
        {met && <CheckIcon />}
      </View>
      <Text style={[reqStyles.label, met && reqStyles.labelMet]}>{label}</Text>
    </View>
  );
}

const reqStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '50%',
    marginBottom: 10,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: A.ghostHi,
    backgroundColor: A.s1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotMet: {
    backgroundColor: A.success,
    borderColor: A.success,
  },
  label: {
    fontSize: 12,
    color: A.text3,
  },
  labelMet: {
    color: A.success,
  },
});

type Props = {
  navigation: NativeStackNavigationProp<any>;
  // Nome de rota genérico (string) em vez do literal 'ResetPassword': o navigator
  // não é tipado, então fornece RouteProp<ParamListBase, string> — um literal aqui
  // o tornaria incompatível com Stack.Screen.
  route: RouteProp<Record<string, { email?: string; code?: string } | undefined>, string>;
};

export default function ResetPasswordScreen({ navigation, route }: Props) {
  const { resetPassword } = useContext(AuthContext);

  const email = route?.params?.email ?? '';
  const code = route?.params?.code ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const hasSymbol = /[!@#$%^&*]/.test(newPassword);
  const isPasswordValid =
    hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSymbol;
  const doPasswordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const canSubmit = isPasswordValid && doPasswordsMatch;

  const handleReset = async () => {
    if (!canSubmit || loading) return;

    if (!email || !code) {
      showAlert('Código ausente', 'Solicite um código de recuperação primeiro.', [
        { text: 'OK', onPress: () => navigation.navigate('ForgotPassword') },
      ]);
      return;
    }

    setLoading(true);
    const result = await resetPassword(email, code, newPassword);
    setLoading(false);

    if (!result.success) {
      // Código errado/expirado: volta para a tela do código (lá dá para reenviar).
      showAlert('Erro', result.error, [
        { text: 'OK', onPress: () => navigation.navigate('VerifyCode', { email }) },
      ]);
      return;
    }

    showAlert(
      'Senha atualizada!',
      'Sua senha foi redefinida com sucesso. Faça login com a nova senha.',
      [{ text: 'Fazer Login', onPress: () => navigation.navigate('Login', { email }) }],
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoider style={styles.kav}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('ForgotPassword'))}
              style={styles.backBtn}
              activeOpacity={0.7}
            >
              <BackArrowIcon />
            </TouchableOpacity>
            <Text style={styles.headerText}>Recuperar acesso</Text>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Title */}
            <Text style={styles.title}>
              {'Crie uma\n'}
              <Text style={styles.titleAccent}>nova senha</Text>
            </Text>

            <Text style={styles.subtitle}>
              {email ? (
                <>
                  Redefinindo o acesso de <Text style={styles.subtitleEmail}>{email}</Text>.
                </>
              ) : (
                'Escolha uma senha forte para proteger sua conta.'
              )}
            </Text>

            {/* New password field */}
            <Text style={styles.fieldLabel}>NOVA SENHA</Text>
            <View style={styles.inputWrap}>
              <LockIcon />
              <TextInput
                style={styles.textInput}
                placeholder="Mínimo 8 caracteres"
                placeholderTextColor={KINETIC.placeholder}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password-new"
                textContentType="newPassword"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn} activeOpacity={0.7}>
                <EyeIcon closed={showPassword} />
              </TouchableOpacity>
            </View>

            {/* Confirm password field */}
            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>CONFIRMAR NOVA SENHA</Text>
            <View style={styles.inputWrap}>
              <LockIcon />
              <TextInput
                style={styles.textInput}
                placeholder="Repita a nova senha"
                placeholderTextColor={KINETIC.placeholder}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password-new"
                textContentType="newPassword"
                returnKeyType="done"
                onSubmitEditing={handleReset}
              />
            </View>

            {/* Show password checkbox */}
            <TouchableOpacity style={styles.checkRow} onPress={() => setShowPassword(!showPassword)} activeOpacity={0.7}>
              <View style={[styles.checkbox, showPassword && styles.checkboxChecked]}>
                {showPassword && <CheckIcon />}
              </View>
              <Text style={styles.checkLabel}>Mostrar senha</Text>
            </TouchableOpacity>

            {/* Password requirements */}
            <View style={styles.requirementsBox}>
              <Text style={styles.requirementsTitle}>REQUISITOS DE SEGURANÇA</Text>
              <View style={styles.requirementsGrid}>
                <RequirementItem label="8+ caracteres" met={hasMinLength} />
                <RequirementItem label="Letra maiúscula" met={hasUppercase} />
                <RequirementItem label="Letra minúscula" met={hasLowercase} />
                <RequirementItem label="Um número" met={hasNumber} />
                <RequirementItem label="Símbolo especial" met={hasSymbol} />
                <RequirementItem label="Senhas iguais" met={doPasswordsMatch} />
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.resetBtn, canSubmit && styles.resetBtnActive]}
              onPress={handleReset}
              disabled={!canSubmit || loading}
              activeOpacity={0.85}
            >
              <Text style={[styles.resetBtnText, canSubmit && styles.resetBtnTextActive]}>
                {loading ? 'Atualizando…' : 'Atualizar senha'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginRow} activeOpacity={0.7}>
              <Text style={styles.loginText}>
                Lembrou a senha?{' '}
                <Text style={styles.loginLink}>Fazer login</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoider>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: A.bg },
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
    backgroundColor: A.s1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 13,
    color: A.text2,
    fontWeight: '500',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: A.text,
    letterSpacing: -1,
    lineHeight: 44,
    marginTop: 12,
    marginBottom: 12,
  },
  titleAccent: {
    color: A.primary,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: A.text2,
    marginBottom: 32,
  },
  subtitleEmail: {
    color: A.text,
    fontWeight: '600',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: A.text3,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  inputWrap: {
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
  textInput: {
    flex: 1,
    fontSize: 15,
    color: A.text,
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
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: A.ghostHi,
    backgroundColor: A.s1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: A.primary,
    borderColor: A.primary,
  },
  checkLabel: {
    fontSize: 13,
    color: A.text2,
  },
  requirementsBox: {
    backgroundColor: A.s1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: A.ghostHi,
    padding: 16,
  },
  requirementsTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: A.text3,
    marginBottom: 14,
  },
  requirementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 12,
  },
  resetBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: A.s1,
    borderWidth: 1,
    borderColor: A.ghostHi,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  },
  resetBtnActive: {
    opacity: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  resetBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: A.text2,
  },
  resetBtnTextActive: {
    color: A.text,
  },
  loginRow: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  loginText: {
    fontSize: 13,
    color: A.text2,
  },
  loginLink: {
    color: A.primary,
    fontWeight: '600',
  },
});
