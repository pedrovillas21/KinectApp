import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
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
import PasswordRequirements from '../../components/PasswordRequirements';
import Icon from '../../components/Icon';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  // Nome de rota genérico (string) em vez do literal 'ResetPassword': o navigator
  // não é tipado, então fornece RouteProp<ParamListBase, string> — um literal aqui
  // o tornaria incompatível com Stack.Screen.
  route: RouteProp<Record<string, { email?: string } | undefined>, string>;
};

export default function ResetPasswordScreen({ navigation, route }: Props) {
  const { isDarkMode } = useContext(ThemeContext);
  const { resetPassword } = useContext(AuthContext);

  const email = route?.params?.email ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const hasSymbol = /[!@#$%^&*]/.test(newPassword);
  const isPasswordValid =
    hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSymbol;
  const doPasswordsMatch = newPassword && newPassword === confirmPassword;

  const handleReset = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Campos obrigatórios', 'Preencha os dois campos de senha.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Senhas diferentes', 'A nova senha e a confirmação não coincidem.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Senha fraca', 'Use ao menos 8 caracteres.');
      return;
    }

    setLoading(true);
    const result = await resetPassword(email, newPassword);
    setLoading(false);

    if (!result.success) {
      Alert.alert('Erro', result.error);
      return;
    }

    Alert.alert(
      'Senha atualizada!',
      'Sua senha foi redefinida com sucesso. Faça login com a nova senha.',
      [{ text: 'Fazer Login', onPress: () => navigation.navigate('Login') }],
    );
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? COLORS.darkBackground : COLORS.lightBackground },
      ]}
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <HeaderLogo showBack />

          <Text
            style={[
              styles.title,
              { color: isDarkMode ? COLORS.textPrimaryDark : COLORS.textPrimaryLight },
            ]}
          >
            Redefinir Senha
          </Text>

          <Text
            style={[
              styles.subtitle,
              { color: isDarkMode ? COLORS.textSecondaryDark : COLORS.textSecondaryLight },
            ]}
          >
            {email ? `Redefinindo para: ${email}` : 'Insira sua nova senha.'}
          </Text>

          <View style={styles.formContainer}>
            <CustomInput
              label="NOVA SENHA"
              placeholder="Mínimo 8 caracteres"
              isPassword
              value={newPassword}
              onChangeText={setNewPassword}
              icon={<Icon name="lock" size={18} color="#888" />}
            />
            <CustomInput
              label="CONFIRMAR NOVA SENHA"
              placeholder="Repita a nova senha"
              isPassword
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              icon={<Icon name="lock" size={18} color="#888" />}
            />

            <PasswordRequirements passwordValue={newPassword} />

            <PrimaryButton
              title="ATUALIZAR SENHA"
              icon={<Icon name="key" size={18} color={COLORS.darkBackground} />}
              onPress={handleReset}
              isLoading={loading}
              disabled={!isPasswordValid || !doPasswordsMatch}
            />
          </View>

          <TouchableOpacity
            style={[styles.footerButton, styles.footerButtonRow]}
            onPress={() => navigation.navigate('Login')}
          >
            <Icon
              name="arrow-left"
              size={15}
              color={isDarkMode ? COLORS.textSecondaryDark : COLORS.textSecondaryLight}
              strokeWidth={2.2}
            />
            <Text
              style={[
                styles.footerText,
                { color: isDarkMode ? COLORS.textSecondaryDark : COLORS.textSecondaryLight },
              ]}
            >
              Voltar para o login
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
  title: { fontSize: 28, fontWeight: 'bold', marginTop: 40, marginBottom: 8 },
  subtitle: { fontSize: 14, marginBottom: 32, color: '#888' },
  formContainer: { paddingVertical: 16 },
  footerButton: { alignItems: 'center', marginTop: 'auto', paddingTop: 40 },
  footerButtonRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  footerText: { fontSize: 14 },
});
