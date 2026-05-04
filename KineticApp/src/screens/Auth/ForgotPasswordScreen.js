import React, { useContext, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeContext } from '../../contexts/ThemeContext';
import { AuthContext } from '../../contexts/AuthContext';
import { COLORS } from '../../theme/colors';
import HeaderLogo from '../../components/HeaderLogo';
import CustomInput from '../../components/CustomInput';
import PrimaryButton from '../../components/PrimaryButton';

export default function ForgotPasswordScreen({ navigation }) {
  const { isDarkMode } = useContext(ThemeContext);
  const { verifyEmail } = useContext(AuthContext);
  const isDark = isDarkMode;

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      Alert.alert('Campo obrigatório', 'Insira o e-mail cadastrado.');
      return;
    }

    setLoading(true);
    const result = await verifyEmail(trimmed);
    setLoading(false);

    if (result.success) {
      navigation.navigate('ResetPassword', { email: trimmed });
    } else {
      Alert.alert('Erro', result.error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? COLORS.darkBackground : COLORS.lightBackground }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <HeaderLogo showBack />

          <View style={styles.titleContainer}>
            <Text style={[styles.titleLine1, { color: isDark ? COLORS.textPrimaryDark : COLORS.textPrimaryLight }]}>
              ESQUECEU
            </Text>
            <Text style={styles.titleLine2}>
              SUA <Text style={styles.titleHighlight}>SENHA?</Text>
            </Text>
          </View>

          <Text style={[styles.subtitle, { color: isDark ? COLORS.textSecondaryDark : COLORS.textSecondaryLight }]}>
            Insira o e-mail associado à sua conta para redefinir sua senha.
          </Text>

          <View style={styles.formContainer}>
            <CustomInput
              label="ENDEREÇO DE E-MAIL"
              placeholder="seu-email@exemplo.com"
              value={email}
              onChangeText={setEmail}
              icon={<Text style={{ color: '#888' }}>✉</Text>}
            />

            <PrimaryButton title="CONTINUAR ⚡" onPress={handleSend} isLoading={loading} />
          </View>

          <TouchableOpacity style={styles.footerButton} onPress={() => navigation.navigate('Login')}>
            <Text style={[styles.footerText, { color: isDark ? COLORS.textSecondaryDark : COLORS.textSecondaryLight }]}>
              ← VOLTAR PARA O LOGIN
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40, flexGrow: 1 },
  titleContainer: { marginTop: 40, marginBottom: 16 },
  titleLine1: { fontSize: 42, fontStyle: 'italic', fontWeight: '900', lineHeight: 45 },
  titleLine2: { fontSize: 42, fontStyle: 'italic', fontWeight: '900', lineHeight: 45, color: '#FFF' },
  titleHighlight: { color: COLORS.neonBlue },
  subtitle: { fontSize: 16, lineHeight: 24, marginBottom: 40 },
  formContainer: { paddingVertical: 16 },
  footerButton: { alignItems: 'center', marginTop: 'auto', paddingTop: 40 },
  footerText: { fontSize: 14, fontWeight: 'bold', letterSpacing: 0.5 },
});
