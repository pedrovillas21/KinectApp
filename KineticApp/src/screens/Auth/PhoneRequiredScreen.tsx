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
import { ThemeContext } from '../../contexts/ThemeContext';
import { AuthContext } from '../../contexts/AuthContext';
import { COLORS } from '../../theme/colors';
import HeaderLogo from '../../components/HeaderLogo';
import CustomInput from '../../components/CustomInput';
import PrimaryButton from '../../components/PrimaryButton';
import { isValidCellPhone, maskCellPhone } from '../../utils/whatsapp';

// Contas criadas antes do celular ser obrigatório caem aqui logo após entrar.
// Não tem "voltar": o app só libera depois do cadastro (ou o usuário sai da conta).
export default function PhoneRequiredScreen() {
  const { isDarkMode } = useContext(ThemeContext);
  const { updatePhone, signOut } = useContext(AuthContext);

  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const isPhoneValid = isValidCellPhone(phone);

  const handleSave = async () => {
    if (!isPhoneValid || loading) return;
    setLoading(true);
    const result = await updatePhone(phone);
    setLoading(false);
    // Sucesso: o AuthContext atualiza o usuário e o roteamento libera o app sozinho.
    if (!result.success) {
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
        <HeaderLogo />

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
            Cadastre seu Celular
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: isDarkMode ? COLORS.textSecondaryDark : COLORS.textSecondaryLight },
            ]}
          >
            Agora o contato com o seu personal é pelo WhatsApp. Informe seu celular para continuar
            usando o app. Ele só aparece para o personal enquanto o vínculo estiver ativo.
          </Text>

          <CustomInput
            label="CELULAR (WHATSAPP)"
            placeholder="(11) 98765-4321"
            value={phone}
            onChangeText={text => setPhone(maskCellPhone(text))}
            keyboardType="phone-pad"
            autoComplete="tel"
            maxLength={15}
          />
          {phone.length > 0 && !isPhoneValid && (
            <Text style={styles.error}>Informe DDD + número do celular.</Text>
          )}

          <PrimaryButton
            title="SALVAR E CONTINUAR"
            onPress={handleSave}
            isLoading={loading}
            disabled={!isPhoneValid}
          />

          <TouchableOpacity style={styles.signOutButton} onPress={signOut} disabled={loading}>
            <Text
              style={[
                styles.signOutText,
                { color: isDarkMode ? COLORS.textSecondaryDark : COLORS.textSecondaryLight },
              ]}
            >
              Sair da conta
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
  error: { color: COLORS.error, fontSize: 13, marginTop: -8, marginBottom: 16 },
  signOutButton: { alignItems: 'center', marginTop: 24 },
  signOutText: { fontSize: 14, fontWeight: 'bold' },
});
