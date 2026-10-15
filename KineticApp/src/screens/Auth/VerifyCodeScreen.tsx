import React, { useContext, useState } from 'react';
import {
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
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

type Props = {
  navigation: NativeStackNavigationProp<any>;
  // Mesmo padrão do ResetPasswordScreen: navigator não tipado.
  route: RouteProp<Record<string, { email?: string } | undefined>, string>;
};

export default function VerifyCodeScreen({ navigation, route }: Props) {
  const { isDarkMode } = useContext(ThemeContext);
  const { requestPasswordReset } = useContext(AuthContext);

  const email = route?.params?.email ?? '';

  const [code, setCode] = useState('');
  const [resending, setResending] = useState(false);

  const isCodeValid = /^\d{6}$/.test(code);

  // O código só é conferido no backend, junto com a nova senha (uso único).
  const handleContinue = () => {
    if (!isCodeValid) {
      Alert.alert('Código inválido', 'Digite os 6 dígitos enviados para o seu e-mail.');
      return;
    }
    navigation.navigate('ResetPassword', { email, code });
  };

  const handleResend = async () => {
    if (!email) {
      navigation.navigate('ForgotPassword');
      return;
    }
    setResending(true);
    const result = await requestPasswordReset(email);
    setResending(false);
    if (result.success) {
      Alert.alert(
        'Código reenviado',
        'Se o e-mail estiver cadastrado, um novo código chegará em instantes. Aguarde 1 minuto entre os pedidos.',
      );
    } else {
      Alert.alert('Erro', result.error);
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
            Verifique seu E-mail
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: isDarkMode ? COLORS.textSecondaryDark : COLORS.textSecondaryLight },
            ]}
          >
            {email
              ? `Se ${email} estiver cadastrado, enviamos um código de 6 dígitos. Ele vale por 15 minutos.`
              : 'Enviamos um código de 6 dígitos para recuperar sua conta.'}
          </Text>

          <CustomInput
            label="CÓDIGO DE VERIFICAÇÃO"
            placeholder="000000"
            value={code}
            onChangeText={text => setCode(text.replace(/\D/g, ''))}
            keyboardType="number-pad"
            maxLength={6}
            autoCorrect={false}
            autoComplete="one-time-code"
          />

          <PrimaryButton title="VERIFICAR" onPress={handleContinue} disabled={!isCodeValid} />

          <TouchableOpacity style={styles.resendButton} onPress={handleResend} disabled={resending}>
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
