import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
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
  route: RouteProp<{ Login: { email?: string } }, 'Login'>;
};

export default function LoginScreen({ navigation, route }: Props) {
  const { isDarkMode } = useContext(ThemeContext);
  const { signIn } = useContext(AuthContext);

  const [email, setEmail] = useState(route.params?.email ?? '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    const result = await signIn({ email: email.trim(), password });
    setLoading(false);
    if (!result.success) {
      Alert.alert('Erro ao entrar', result.error);
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

          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotPass}
          >
            <Text style={styles.forgotText}>Esqueceu a senha?</Text>
          </TouchableOpacity>

          <PrimaryButton title="INICIAR SESSÃO" onPress={handleLogin} isLoading={loading} />

          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            style={styles.registerBtn}
          >
            <Text
              style={[
                styles.registerText,
                { color: isDarkMode ? COLORS.textSecondaryDark : COLORS.textSecondaryLight },
              ]}
            >
              Ainda não tem conta?{' '}
              <Text style={{ color: COLORS.neonBlue }}>Cadastre-se</Text>
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
  },
});
