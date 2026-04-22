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

export default function LoginScreen({ navigation }) {
  const { isDarkMode } = useContext(ThemeContext);
  const { signIn } = useContext(AuthContext);
  const isDark = isDarkMode;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    const result = signIn({ email: email.trim(), password });
    if (!result.success) {
      Alert.alert('Erro ao entrar', result.error);
    }
    // Se success = true, o AuthContext muda isLoggedIn e a navegação troca automaticamente
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? COLORS.darkBackground : COLORS.lightBackground }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inner}>
        <HeaderLogo />

        <View style={styles.content}>
          <Text style={[styles.title, { color: isDark ? COLORS.textPrimaryDark : COLORS.textPrimaryLight }]}>
            Bem-vindo de volta!
          </Text>

          <CustomInput
            label="E-MAIL"
            placeholder="seu-email@exemplo.com"
            value={email}
            onChangeText={setEmail}
          />
          <CustomInput
            label="SENHA"
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotPass}>
            <Text style={styles.forgotText}>Esqueceu a senha?</Text>
          </TouchableOpacity>

          <PrimaryButton title="INICIAR SESSÃO" onPress={handleLogin} isLoading={loading} />

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.registerBtn}>
            <Text style={[styles.registerText, { color: isDark ? COLORS.textSecondaryDark : COLORS.textSecondaryLight }]}>
              Ainda não tem conta? <Text style={{ color: COLORS.neonBlue }}>Cadastre-se</Text>
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
  forgotPass: {
    alignSelf: 'flex-end',
    marginBottom: 32,
  },
  forgotText: {
    color: COLORS.neonBlue,
    fontWeight: 'bold',
  },
  registerBtn: {
    marginTop: 24,
    alignItems: 'center',
  },
  registerText: {
    fontSize: 14,
  }
});
