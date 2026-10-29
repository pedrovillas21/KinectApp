import React, { useContext, useState } from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { Text, TextInput } from '../../components/ui/scaled';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../../contexts/AuthContext';
import { showAlert } from '../../components/ui/AlertHost';
import KeyboardAvoider from '../../components/ui/KeyboardAvoider';

import { BackArrowIcon } from '../../components/auth/AuthIcons';
import type { AuthScreenProps } from '../../navigation/types';
import { createStyles, useColors } from '../../theme/ThemeContext';

type Props = AuthScreenProps<'VerifyCode'>;

export default function VerifyCodeScreen({ navigation, route }: Props) {
  const styles = useStyles();
  const c = useColors();
  const { requestPasswordReset } = useContext(AuthContext);

  const email = route?.params?.email ?? '';

  const [code, setCode] = useState('');
  const [resending, setResending] = useState(false);

  const isCodeValid = /^\d{6}$/.test(code);

  // O código só é conferido no backend, junto com a nova senha (uso único).
  const handleContinue = () => {
    if (!isCodeValid) return;
    navigation.navigate('ResetPassword', { email, code });
  };

  const handleResend = async () => {
    if (resending) return;
    if (!email) {
      navigation.navigate('ForgotPassword');
      return;
    }
    setResending(true);
    const result = await requestPasswordReset(email);
    setResending(false);
    if (result.success) {
      showAlert(
        'Código reenviado',
        'Se o e-mail estiver cadastrado, um novo código chegará em instantes. Aguarde 1 minuto entre os pedidos.',
      );
    } else {
      showAlert('Erro', result.error);
    }
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
              {'Confira seu\n'}
              <Text style={styles.titleAccent}>e-mail</Text>
            </Text>

            <Text style={styles.subtitle}>
              {email ? (
                <>
                  Se <Text style={styles.subtitleEmail}>{email}</Text> estiver cadastrado, enviamos um código de 6
                  dígitos. Ele vale por 15 minutos.
                </>
              ) : (
                'Enviamos um código de 6 dígitos para recuperar sua conta.'
              )}
            </Text>

            {/* Code field */}
            <Text style={styles.fieldLabel}>CÓDIGO DE VERIFICAÇÃO</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.codeInput}
                placeholder="000000"
                placeholderTextColor={c.placeholder}
                value={code}
                onChangeText={text => setCode(text.replace(/\D/g, ''))}
                keyboardType="number-pad"
                maxLength={6}
                autoCorrect={false}
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                returnKeyType="done"
                onSubmitEditing={handleContinue}
              />
            </View>

            <TouchableOpacity
              onPress={handleResend}
              disabled={resending}
              style={styles.resendRow}
              activeOpacity={0.7}
            >
              <Text style={styles.resendText}>
                Não recebeu?{' '}
                <Text style={styles.resendLink}>{resending ? 'Reenviando…' : 'Reenviar código'}</Text>
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.verifyBtn, isCodeValid && styles.verifyBtnActive]}
              onPress={handleContinue}
              disabled={!isCodeValid}
              activeOpacity={0.85}
            >
              <Text style={[styles.verifyBtnText, isCodeValid && styles.verifyBtnTextActive]}>Verificar</Text>
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
    backgroundColor: c.surface1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.ghostHi,
    paddingHorizontal: 14,
    height: 64,
  },
  codeInput: {
    flex: 1,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: 10,
    textAlign: 'center',
    color: c.text,
    padding: 0,
  },
  resendRow: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 4,
  },
  resendText: {
    fontSize: 13,
    color: c.textDim,
  },
  resendLink: {
    color: c.primary,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 12,
  },
  verifyBtn: {
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
  verifyBtnActive: {
    opacity: 1,
    borderColor: c.borderStrong,
  },
  verifyBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: c.textDim,
  },
  verifyBtnTextActive: {
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
