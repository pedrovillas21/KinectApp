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
import { AuthContext } from '../../contexts/AuthContext';
import Svg, { Path } from 'react-native-svg';
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

function EmailIcon({ size = 16, color = A.text3 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M22 6l-10 7L2 6"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function ForgotPasswordScreen({ navigation }: Props) {
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
                placeholderTextColor={KINETIC.placeholder}
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
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 12,
  },
  sendBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: A.s1,
    borderWidth: 1,
    borderColor: A.ghostHi,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  },
  sendBtnActive: {
    opacity: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  sendBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: A.text2,
  },
  sendBtnTextActive: {
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
