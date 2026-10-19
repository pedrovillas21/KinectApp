import React, { useContext, useState } from 'react';
import {
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { ThemeContext } from '../../contexts/ThemeContext';
import { AuthContext } from '../../contexts/AuthContext';
import { COLORS } from '../../theme/colors';
import HeaderLogo from '../../components/HeaderLogo';
import CustomInput from '../../components/CustomInput';
import PrimaryButton from '../../components/PrimaryButton';
import { showAlert } from '../../components/ui/AlertHost';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  // Mesmo padrão do ResetPasswordScreen: navigator não tipado.
  route: RouteProp<Record<string, { email?: string } | undefined>, string>;
};

// Aberta depois do cadastro e quando o login recusa uma conta não confirmada.
// Nos dois casos o backend já enviou o código.
export default function ConfirmEmailScreen({ navigation, route }: Props) {
  const { isDarkMode } = useContext(ThemeContext);
  const { confirmEmail, resendConfirmation } = useContext(AuthContext);

  const email = route?.params?.email ?? '';

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const isCodeValid = /^\d{6}$/.test(code);

  const handleConfirm = async () => {
    if (!isCodeValid || loading) return;
    setLoading(true);
    const result = await confirmEmail(email, code);
    setLoading(false);

    if (!result.success) {
      showAlert('Erro', result.error);
      return;
    }

    showAlert('E-mail confirmado!', 'Agora faça login com seu e-mail e senha.', [
      { text: 'Fazer Login', onPress: () => navigation.navigate('Login', { email }) },
    ]);
  };

  const handleResend = async () => {
    if (resending) return;
    setResending(true);
    const result = await resendConfirmation(email);
    setResending(false);
    if (result.success) {
      showAlert(
        'Código reenviado',
        'Um novo código chegará em instantes. Aguarde 1 minuto entre os pedidos.',
      );
    } else {
      showAlert('Erro', result.error);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? COLORS.darkBackground : COLORS.lightBackground },
      ]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        <HeaderLogo showBack />

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text
            style={[
              styles.title,
              { color: isDarkMode ? COLORS.textPrimaryDark : COLORS.textPrimaryLight },
            ]}
          >
            Confirme seu E-mail
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: isDarkMode ? COLORS.textSecondaryDark : COLORS.textSecondaryLight },
            ]}
          >
            {email
              ? `Enviamos um código de 6 dígitos para ${email}. Ele vale por 30 minutos.`
              : 'Enviamos um código de 6 dígitos para o seu e-mail.'}
          </Text>

          <CustomInput
            label="CÓDIGO DE CONFIRMAÇÃO"
            placeholder="000000"
            value={code}
            onChangeText={text => setCode(text.replace(/\D/g, ''))}
            keyboardType="number-pad"
            maxLength={6}
            autoCorrect={false}
            autoComplete="one-time-code"
          />

          <PrimaryButton
            title="CONFIRMAR"
            onPress={handleConfirm}
            isLoading={loading}
            disabled={!isCodeValid || !email}
          />

          <TouchableOpacity style={styles.resendButton} onPress={handleResend} disabled={resending || !email}>
            <Text
              style={[
                styles.resendText,
                { color: isDarkMode ? COLORS.textSecondaryDark : COLORS.textSecondaryLight },
              ]}
            >
              {resending ? 'Reenviando...' : 'Não recebeu? Reenviar código'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 24 },
  content: { flexGrow: 1, justifyContent: 'center', paddingBottom: 40 },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 40,
  },
  resendButton: { alignItems: 'center', marginTop: 24 },
  resendText: { fontSize: 14, fontWeight: 'bold' },
});
