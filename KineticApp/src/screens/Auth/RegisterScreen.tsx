import React, { useContext, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Text, TextInput } from '../../components/ui/scaled';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../../contexts/AuthContext';
import Svg, { Path, Circle } from 'react-native-svg';
import { isValidCellPhone, maskCellPhone } from '../../utils/whatsapp';
import { savePendingInviteCode } from '../../services/trainerService';
import { showAlert } from '../../components/ui/AlertHost';
import KeyboardAvoider from '../../components/ui/KeyboardAvoider';
import { KINETIC } from '../../theme/kinetic';
import { PRIVACY_URL, TERMS_URL, openLegal } from '../../config/legal';
import { BackArrowIcon, EmailIcon, LockIcon, EyeIcon, PhoneIcon, CheckIcon } from '../../components/auth/AuthIcons';
import RequirementItem from '../../components/auth/RequirementItem';
import { PASSWORD_REGEX, passwordChecks } from '../../constants/password';
import type { AuthScreenProps } from '../../navigation/types';

function PersonIcon({ size = 16, color = KINETIC.textMuted }: { size?: number; color?: string }) {
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

type Props = AuthScreenProps<'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const { register } = useContext(AuthContext);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const checks = passwordChecks(password);
  const isPasswordValid = PASSWORD_REGEX.test(password);

  const isPhoneValid = isValidCellPhone(phone);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const canSubmit =
    name.trim().length > 0 && email.trim().length > 0 && isPhoneValid && isPasswordValid && acceptedTerms;

  const handleRegister = async () => {
    if (!canSubmit || loading) return;
    setLoading(true);
    const result = await register({ name: name.trim(), email: email.trim(), phone, password });
    setLoading(false);

    if (!result.success) {
      showAlert('Erro no cadastro', result.error);
      return;
    }

    // Resgatado no primeiro login (ver usePendingInviteRedeem): antes disso o
    // e-mail precisa ser confirmado e ainda não há sessão.
    if (inviteCode.trim()) {
      await savePendingInviteCode(inviteCode, email);
    }

    showAlert(
      'Cadastro realizado!',
      `Bem-vindo, ${name.trim()}! Enviamos um código para ${email.trim()}. Confirme seu e-mail para entrar.`,
      [{ text: 'Confirmar e-mail', onPress: () => navigation.navigate('ConfirmEmail', { email: email.trim() }) }],
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoider style={styles.kav}
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
                placeholderTextColor={KINETIC.placeholder}
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
                placeholderTextColor={KINETIC.placeholder}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Phone field */}
            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>CELULAR (WHATSAPP)</Text>
            <View style={styles.inputWrap}>
              <PhoneIcon />
              <TextInput
                style={styles.textInput}
                placeholder="(11) 98765-4321"
                placeholderTextColor={KINETIC.placeholder}
                value={phone}
                onChangeText={(v) => setPhone(maskCellPhone(v))}
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
                autoComplete="tel"
                maxLength={15}
              />
            </View>
            <Text style={styles.fieldHint}>
              {phone.length > 0 && !isPhoneValid
                ? 'Informe DDD + número do celular.'
                : 'Seu personal usa este número para falar com você pelo WhatsApp.'}
            </Text>

            {/* Invite code field (opcional) */}
            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>CÓDIGO DE CONVITE (OPCIONAL)</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.textInput}
                placeholder="Ex.: ABCDE-23456"
                placeholderTextColor={KINETIC.placeholder}
                value={inviteCode}
                onChangeText={(v) => setInviteCode(v.toUpperCase())}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={16}
              />
            </View>
            <Text style={styles.fieldHint}>
              Recebeu um link do seu personal? Digite o código para entrar na carteira dele.
            </Text>

            {/* Password field */}
            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>SENHA</Text>
            <View style={styles.inputWrap}>
              <LockIcon />
              <TextInput
                style={styles.textInput}
                placeholder="8 a 20 caracteres"
                placeholderTextColor={KINETIC.placeholder}
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
                <RequirementItem label="8 a 20 caracteres" met={checks.length} />
                <RequirementItem label="Letra maiúscula" met={checks.uppercase} />
                <RequirementItem label="Letra minúscula" met={checks.lowercase} />
                <RequirementItem label="Símbolo especial" met={checks.symbol} />
              </View>
            </View>

            {/* Aceite: consentimento destacado para dados de saúde (LGPD art. 11, I) */}
            <TouchableOpacity
              style={[styles.checkRow, styles.termsRow]}
              onPress={() => setAcceptedTerms(!acceptedTerms)}
              activeOpacity={0.7}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: acceptedTerms }}
            >
              <View style={[styles.checkbox, styles.termsCheckbox, acceptedTerms && styles.checkboxChecked]}>
                {acceptedTerms && <CheckIcon />}
              </View>
              <Text style={[styles.checkLabel, styles.termsLabel]}>
                Li e aceito os{' '}
                <Text style={styles.loginLink} onPress={() => openLegal(TERMS_URL)}>
                  Termos de Uso
                </Text>{' '}
                e a{' '}
                <Text style={styles.loginLink} onPress={() => openLegal(PRIVACY_URL)}>
                  Política de Privacidade
                </Text>
                , inclusive o uso dos meus dados de saúde (peso, medidas, lesões e treinos) para montar e acompanhar
                meus treinos.
              </Text>
            </TouchableOpacity>
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
        </KeyboardAvoider>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: KINETIC.bg },
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
    backgroundColor: KINETIC.surface1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 13,
    color: KINETIC.textDim,
    fontWeight: '500',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: KINETIC.text,
    letterSpacing: -1,
    lineHeight: 44,
    marginTop: 12,
    marginBottom: 32,
  },
  titleAccent: {
    color: KINETIC.primary,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: KINETIC.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: KINETIC.surface1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: KINETIC.ghostHi,
    paddingHorizontal: 14,
    height: 52,
  },
  fieldHint: {
    fontSize: 12,
    color: KINETIC.textMuted,
    marginTop: 6,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: KINETIC.text,
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
    borderColor: KINETIC.ghostHi,
    backgroundColor: KINETIC.surface1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  termsRow: {
    alignItems: 'flex-start',
    marginTop: 20,
  },
  termsCheckbox: {
    marginTop: 2,
  },
  termsLabel: {
    flex: 1,
    lineHeight: 19,
  },
  checkboxChecked: {
    backgroundColor: KINETIC.primary,
    borderColor: KINETIC.primary,
  },
  checkLabel: {
    fontSize: 13,
    color: KINETIC.textDim,
  },
  requirementsBox: {
    backgroundColor: KINETIC.surface1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: KINETIC.ghostHi,
    padding: 16,
  },
  requirementsTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: KINETIC.textMuted,
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
    backgroundColor: KINETIC.surface1,
    borderWidth: 1,
    borderColor: KINETIC.ghostHi,
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
    color: KINETIC.textDim,
  },
  registerBtnTextActive: {
    color: KINETIC.text,
  },
  loginRow: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  loginText: {
    fontSize: 13,
    color: KINETIC.textDim,
  },
  loginLink: {
    color: KINETIC.primary,
    fontWeight: '600',
  },
});
