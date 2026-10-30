import React, { useContext, useState } from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { Text, TextInput } from '../../components/ui/scaled';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../../contexts/AuthContext';
import { showAlert } from '../../components/ui/AlertHost';
import KeyboardAvoider from '../../components/ui/KeyboardAvoider';

import { BackArrowIcon, EmailIcon } from '../../components/auth/AuthIcons';
import type { AuthScreenProps } from '../../navigation/types';
import { createStyles, useColors } from '../../theme/ThemeContext';

type Props = AuthScreenProps<'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const styles = useStyles();
  const c = useColors();
  const { requestPasswordReset } = useContext(AuthContext);

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit = email.trim().length > 0;

  const handleSend = async () => {
    if (!canSubmit || loading) return;
    const trimmed = email.trim();

    setLoading(true);
    const result = await requestPasswordReset(trimmed);
    setLoading(false);

    if (result.success) {
      navigation.navigate('VerifyCode', { email: trimmed });
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
              onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Login'))}
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
              {'Esqueceu a\n'}
              <Text style={styles.titleAccent}>senha?</Text>
            </Text>

            <Text style={styles.subtitle}>
              Insira o e-mail associado à sua conta. Enviaremos um código de 6 dígitos para redefinir sua senha.
            </Text>

            {/* Email field */}
            <Text style={styles.fieldLabel}>E-MAIL</Text>
            <View style={styles.inputWrap}>
              <EmailIcon />
              <TextInput
                style={styles.textInput}
                placeholder="nome@email.com"
                placeholderTextColor={c.placeholder}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                returnKeyType="send"
                onSubmitEditing={handleSend}
              />
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.sendBtn, canSubmit && styles.sendBtnActive]}
              onPress={handleSend}
              disabled={!canSubmit || loading}
              activeOpacity={0.85}
            >
              <Text style={[styles.sendBtnText, canSubmit && styles.sendBtnTextActive]}>
                {loading ? 'Enviando…' : 'Enviar código'}
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
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 12,
  },
  sendBtn: {
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
  sendBtnActive: {
    opacity: 1,
    borderColor: c.borderStrong,
  },
  sendBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: c.textDim,
  },
  sendBtnTextActive: {
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
