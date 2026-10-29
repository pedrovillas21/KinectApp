import React, { useContext, useState } from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { Text, TextInput } from '../../components/ui/scaled';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../../contexts/AuthContext';
import { showAlert } from '../../components/ui/AlertHost';
import KeyboardAvoider from '../../components/ui/KeyboardAvoider';

import { BackArrowIcon, LockIcon, EyeIcon, CheckIcon } from '../../components/auth/AuthIcons';
import RequirementItem from '../../components/auth/RequirementItem';
import { PASSWORD_REGEX, passwordChecks } from '../../constants/password';
import type { AuthScreenProps } from '../../navigation/types';
import { createStyles, useColors } from '../../theme/ThemeContext';

type Props = AuthScreenProps<'ResetPassword'>;

export default function ResetPasswordScreen({ navigation, route }: Props) {
  const styles = useStyles();
  const c = useColors();
  const { resetPassword } = useContext(AuthContext);

  const email = route?.params?.email ?? '';
  const code = route?.params?.code ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const checks = passwordChecks(newPassword);
  const isPasswordValid = PASSWORD_REGEX.test(newPassword);
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
                placeholder="8 a 20 caracteres"
                placeholderTextColor={c.placeholder}
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
                placeholderTextColor={c.placeholder}
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
                <RequirementItem label="8 a 20 caracteres" met={checks.length} />
                <RequirementItem label="Letra maiúscula" met={checks.uppercase} />
                <RequirementItem label="Letra minúscula" met={checks.lowercase} />
                <RequirementItem label="Símbolo especial" met={checks.symbol} />
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

const useStyles = createStyles((c, s) => ({
  container: { flex: 1, backgroundColor: c.bg },
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
    backgroundColor: c.surface1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 13,
    color: c.textDim,
    fontWeight: '500',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: c.text,
    letterSpacing: -1,
    lineHeight: 44,
    marginTop: 12,
    marginBottom: 12,
  },
  titleAccent: {
    color: c.primary,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: c.textDim,
    marginBottom: 32,
  },
  subtitleEmail: {
    color: c.text,
    fontWeight: '600',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: c.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  inputWrap: { 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: c.surface1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.ghostHi,
    paddingHorizontal: 14,
    height: 52,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: c.text,
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
    borderColor: c.ghostHi,
    backgroundColor: c.surface1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: c.primaryFill,
    borderColor: c.primary,
  },
  checkLabel: {
    fontSize: 13,
    color: c.textDim,
  },
  requirementsBox: {
    ...s.card,
    backgroundColor: c.surface1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.ghostHi,
    padding: 16,
  },
  requirementsTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: c.textMuted,
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
    ...s.card,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: c.surface1,
    borderWidth: 1,
    borderColor: c.ghostHi,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  },
  resetBtnActive: {
    opacity: 1,
    borderColor: c.borderStrong,
  },
  resetBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: c.textDim,
  },
  resetBtnTextActive: {
    color: c.text,
  },
  loginRow: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  loginText: {
    fontSize: 13,
    color: c.textDim,
  },
  loginLink: {
    color: c.primary,
    fontWeight: '600',
  },
}));
