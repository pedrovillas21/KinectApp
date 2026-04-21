import React, { useContext, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { ThemeContext } from '../../contexts/ThemeContext';
import { AuthContext } from '../../contexts/AuthContext';
import { COLORS } from '../../theme/colors';
import HeaderLogo from '../../components/HeaderLogo';
import CustomInput from '../../components/CustomInput';
import PrimaryButton from '../../components/PrimaryButton';

export default function RegisterScreen({ navigation }) {
  const { isDarkMode } = useContext(ThemeContext);
  const { register } = useContext(AuthContext);
  const isDark = isDarkMode;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = () => {
    const result = register({ name: name.trim(), email: email.trim(), password });

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
            placeholder="Mínimo 6 caracteres"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <PrimaryButton title="CADASTRAR E COMEÇAR" onPress={handleRegister} isLoading={loading} />

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
