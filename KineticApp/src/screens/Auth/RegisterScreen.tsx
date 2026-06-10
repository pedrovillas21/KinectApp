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
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthContext } from '../../contexts/AuthContext';
import Svg, { Path, Circle } from 'react-native-svg';

const A = {
  bg: '#131313',
  s1: '#1c1b1b',
  primary: '#00E5FF',
  text: '#f5f6f7',
  text2: 'rgba(245,246,247,0.60)',
  text3: 'rgba(245,246,247,0.34)',
  ghostHi: 'rgba(255,255,255,0.13)',
  success: '#4ade80',
};

function BackArrowIcon({ size = 20, color = '#f5f6f7' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M5 12l7 7M5 12l7-7"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PersonIcon({ size = 16, color = A.text3 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth={1.5} />
    </Svg>
  );
}

function EmailIcon({ size = 16, color = A.text3 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M22 6l-10 7L2 6"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LockIcon({ size = 16, color = A.text3 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7 11V7a5 5 0 0110 0v4"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function EyeIcon({ size = 18, color = A.text3, closed = false }: { size?: number; color?: string; closed?: boolean }) {
  if (closed) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M1 1l22 22"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={1.5} />
    </Svg>
  );
}

function CheckIcon({ size = 10, color = '#001a1f' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M5 12l5 5L20 7"
        stroke={color}
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

type Requirement = { label: string; met: boolean };

function RequirementItem({ label, met }: Requirement) {
  return (
    <View style={reqStyles.row}>
      <View style={[reqStyles.dot, met && reqStyles.dotMet]}>
        {met && <CheckIcon />}
      </View>
      <Text style={[reqStyles.label, met && reqStyles.labelMet]}>{label}</Text>
    </View>
  );
}

const reqStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '50%',
    marginBottom: 10,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: A.ghostHi,
    backgroundColor: A.s1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotMet: {
    backgroundColor: A.success,
    borderColor: A.success,
  },
  label: {
    fontSize: 12,
    color: A.text3,
  },
  labelMet: {
    color: A.success,
  },
});

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function RegisterScreen({ navigation }: Props) {
  const { register } = useContext(AuthContext);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[!@#$%^&*]/.test(password);
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSymbol;

  const canSubmit = name.trim().length > 0 && email.trim().length > 0 && isPasswordValid;

  const handleRegister = async () => {
    if (!canSubmit || loading) return;
    setLoading(true);
    const result = await register({ name: name.trim(), email: email.trim(), password });
    setLoading(false);

    if (!result.success) {
      Alert.alert('Erro no cadastro', result.error);
      return;
    }

    Alert.alert(
      'Cadastro realizado!',
      `Bem-vindo, ${name.trim()}! Agora faça login com suas credenciais.`,
      [{ text: 'Fazer Login', onPress: () => navigation.navigate('Login') }],
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kav}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
              <BackArrowIcon />
            </TouchableOpacity>
            <Text style={styles.headerText}>Criar sua conta</Text>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Title */}
            <Text style={styles.title}>
              {'Junte-se à\n'}
              <Text style={styles.titleAccent}>Kinetic</Text>
            </Text>

            {/* Name field */}
            <Text style={styles.fieldLabel}>NOME</Text>
            <View style={styles.inputWrap}>
              <PersonIcon />
              <TextInput
                style={styles.textInput}
                placeholder="Seu nome completo"
                placeholderTextColor={A.text3}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            {/* Email field */}
            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>E-MAIL</Text>
            <View style={styles.inputWrap}>
              <EmailIcon />
              <TextInput
                style={styles.textInput}
                placeholder="seu-email@exemplo.com"
                placeholderTextColor={A.text3}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password field */}
            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>SENHA</Text>
            <View style={styles.inputWrap}>
              <LockIcon />
              <TextInput
                style={styles.textInput}
                placeholder="Mínimo 8 caracteres"
                placeholderTextColor={A.text3}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn} activeOpacity={0.7}>
                <EyeIcon closed={showPassword} />
              </TouchableOpacity>
            </View>

            {/* Show password checkbox */}
            <TouchableOpacity style={styles.checkRow} onPress={() => setShowPassword(!showPassword)} activeOpacity={0.7}>
              <View style={[styles.checkbox, showPassword && styles.checkboxChecked]}>
                {showPassword && <CheckIcon />}
              </View>
              <Text style={styles.checkLabel}>Mostrar senha</Text>
            </TouchableOpacity>

            {/* Password requirements */}
            <View style={styles.requirementsBox}>
              <Text style={styles.requirementsTitle}>REQUISITOS DE SEGURANÇA</Text>
              <View style={styles.requirementsGrid}>
                <RequirementItem label="8+ caracteres" met={hasMinLength} />
                <RequirementItem label="Letra maiúscula" met={hasUppercase} />
                <RequirementItem label="Letra minúscula" met={hasLowercase} />
                <RequirementItem label="Um número" met={hasNumber} />
                <RequirementItem label="Símbolo especial" met={hasSymbol} />
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.registerBtn, canSubmit && styles.registerBtnActive]}
              onPress={handleRegister}
              disabled={!canSubmit || loading}
              activeOpacity={0.85}
            >
              <Text style={[styles.registerBtnText, canSubmit && styles.registerBtnTextActive]}>
                {loading ? 'Cadastrando…' : 'Cadastrar e Começar'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginRow} activeOpacity={0.7}>
              <Text style={styles.loginText}>
                Já tem uma conta?{' '}
                <Text style={styles.loginLink}>Fazer login</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: A.bg },
  safe: { flex: 1 },
  kav: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: A.s1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 13,
    color: A.text2,
    fontWeight: '500',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: A.text,
    letterSpacing: -1,
    lineHeight: 44,
    marginTop: 12,
    marginBottom: 32,
  },
  titleAccent: {
    color: A.primary,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: A.text3,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: A.s1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: A.ghostHi,
    paddingHorizontal: 14,
    height: 52,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: A.text,
    padding: 0,
  },
  eyeBtn: {
    padding: 4,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: A.ghostHi,
    backgroundColor: A.s1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: A.primary,
    borderColor: A.primary,
  },
  checkLabel: {
    fontSize: 13,
    color: A.text2,
  },
  requirementsBox: {
    backgroundColor: A.s1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: A.ghostHi,
    padding: 16,
  },
  requirementsTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: A.text3,
    marginBottom: 14,
  },
  requirementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 12,
  },
  registerBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: A.s1,
    borderWidth: 1,
    borderColor: A.ghostHi,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  },
  registerBtnActive: {
    opacity: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  registerBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: A.text2,
  },
  registerBtnTextActive: {
    color: A.text,
  },
  loginRow: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  loginText: {
    fontSize: 13,
    color: A.text2,
  },
  loginLink: {
    color: A.primary,
    fontWeight: '600',
  },
});
