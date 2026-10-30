import React, { useContext, useState } from 'react';
import { ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '../../components/ui/scaled';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../../contexts/AuthContext';

import { Button, StackHeader, TextField } from '../../components/ui';
import { showAlert } from '../../components/ui/AlertHost';
import KeyboardAvoider from '../../components/ui/KeyboardAvoider';
import type { AuthScreenProps } from '../../navigation/types';
import { createStyles, useColors } from '../../theme/ThemeContext';

type Props = AuthScreenProps<'ConfirmEmail'>;

// Aberta depois do cadastro e quando o login recusa uma conta não confirmada.
// Nos dois casos o backend já enviou o código.
export default function ConfirmEmailScreen({ navigation, route }: Props) {
  const styles = useStyles();
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
    <SafeAreaView style={styles.container}>
      <StackHeader onBack={() => navigation.goBack()} />
      <KeyboardAvoider style={styles.inner}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Confirme seu E-mail</Text>
          <Text style={styles.subtitle}>
            {email
              ? `Enviamos um código de 6 dígitos para ${email}. Ele vale por 30 minutos.`
              : 'Enviamos um código de 6 dígitos para o seu e-mail.'}
          </Text>

          <TextField
            label="Código de confirmação"
            placeholder="000000"
            value={code}
            onChangeText={(text) => setCode(text.replace(/\D/g, ''))}
            keyboardType="number-pad"
            maxLength={6}
            autoCorrect={false}
            autoComplete="one-time-code"
            mono
            style={styles.field}
          />

          <Button
            label="Confirmar"
            onPress={handleConfirm}
            loading={loading}
            disabled={!isCodeValid || !email}
          />

          <TouchableOpacity style={styles.resendButton} onPress={handleResend} disabled={resending || !email}>
            <Text style={styles.resendText}>
              {resending ? 'Reenviando...' : 'Não recebeu? Reenviar código'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoider>
    </SafeAreaView>
  );
}

const useStyles = createStyles((c) => ({
  container: { flex: 1, backgroundColor: c.bg },
  inner: { flex: 1, paddingHorizontal: 24 },
  content: { flexGrow: 1, justifyContent: 'center', paddingBottom: 40 },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    color: c.text,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 40,
    color: c.textSecondary,
  },
  field: { marginBottom: 20 },
  resendButton: { alignItems: 'center', marginTop: 24 },
  resendText: { fontSize: 14, fontWeight: 'bold', color: c.textSecondary },
}));
