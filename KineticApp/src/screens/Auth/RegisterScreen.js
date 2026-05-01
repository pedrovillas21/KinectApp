import React, { useContext, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeContext } from '../../contexts/ThemeContext';
import { AuthContext } from '../../contexts/AuthContext';
import { COLORS } from '../../theme/colors';
import HeaderLogo from '../../components/HeaderLogo';
import CustomInput from '../../components/CustomInput';
import PrimaryButton from '../../components/PrimaryButton';
import PasswordRequirements from '../../components/PasswordRequirements';

export default function RegisterScreen({ navigation }) {
  const { isDarkMode } = useContext(ThemeContext);
  const { register } = useContext(AuthContext);
  const isDark = isDarkMode;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const hasMinLength  = password.length >= 8;
  const hasUppercase  = /[A-Z]/.test(password);
  const hasLowercase  = /[a-z]/.test(password);
  const hasNumber     = /\d/.test(password);
  const hasSymbol     = /[!@#$%^&*]/.test(password);
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSymbol;

  const handleRegister = async () => {
    setLoading(true);
    const result = await register({ name: name.trim(), email: email.trim(), password });
    setLoading(false);

    if (!result.success) {
      Alert.alert('Erro no cadastro', result.error);
      return;
    }

    Alert.alert(
      'Cadastro realizado! ✅',
      `Bem-vindo, ${name.trim()}! Agora faça login com suas credenciais.`,
      [{ text: 'Fazer Login', onPress: () => navigation.navigate('Login') }]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? COLORS.darkBackground : COLORS.lightBackground }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inner}>
        <HeaderLogo showBack />

        <View style={styles.content}>
          <Text style={[styles.title, { color: isDark ? COLORS.textPrimaryDark : COLORS.textPrimaryLight }]}>
            Junte-se ao Kinetic
          </Text>

          <CustomInput
            label="NOME"
            placeholder="Seu nome completo"
            value={name}
            onChangeText={setName}
          />
          <CustomInput
            label="E-MAIL"
            placeholder="seu-email@exemplo.com"
            value={email}
            onChangeText={setEmail}
          />
          <CustomInput
            label="SENHA"
            placeholder="Mínimo 8 caracteres"
            isPassword
            value={password}
            onChangeText={setPassword}
          />

          <PasswordRequirements passwordValue={password} />

          <PrimaryButton title="CADASTRAR E COMEÇAR" onPress={handleRegister} isLoading={loading} disabled={!isPasswordValid || !name.trim() || !email.trim()} />

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.loginBtn}>
            <Text style={[styles.loginText, { color: isDark ? COLORS.textSecondaryDark : COLORS.textSecondaryLight }]}>
              Já tem uma conta? <Text style={{ color: COLORS.neonBlue }}>Fazer login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 24, paddingBottom: 40 },
  content: { flex: 1, justifyContent: 'center' },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  loginBtn: {
    marginTop: 24,
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
  }
});
