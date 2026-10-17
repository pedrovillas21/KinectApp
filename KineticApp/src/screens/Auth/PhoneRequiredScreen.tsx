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
import { AuthContext } from '../../contexts/AuthContext';
import Svg, { Path } from 'react-native-svg';
import { isValidCellPhone, maskCellPhone } from '../../utils/whatsapp';

const A = {
  bg: '#131313',
  s1: '#1c1b1b',
  primary: '#00E5FF',
  text: '#f5f6f7',
  text2: 'rgba(245,246,247,0.60)',
  text3: 'rgba(245,246,247,0.34)',
  ghostHi: 'rgba(255,255,255,0.13)',
};

function PhoneIcon({ size = 16, color = A.text3 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Contas criadas antes do celular ser obrigatório caem aqui logo após entrar.
// Não tem "voltar": o app só libera depois do cadastro (ou o usuário sai da conta).
export default function PhoneRequiredScreen() {
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
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kav}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerText}>Falta só um passo</Text>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Title */}
            <Text style={styles.title}>
              {'Cadastre seu\n'}
              <Text style={styles.titleAccent}>celular</Text>
            </Text>

            <Text style={styles.subtitle}>
              Agora o contato com o seu personal é pelo WhatsApp. Informe seu celular para continuar
              usando o app. Ele só aparece para o personal enquanto o vínculo estiver ativo.
            </Text>

            {/* Phone field */}
            <Text style={styles.fieldLabel}>CELULAR (WHATSAPP)</Text>
            <View style={styles.inputWrap}>
              <PhoneIcon />
              <TextInput
                style={styles.textInput}
                placeholder="(11) 98765-4321"
                placeholderTextColor={A.text3}
                value={phone}
                onChangeText={(v) => setPhone(maskCellPhone(v))}
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
                autoComplete="tel"
                maxLength={15}
                returnKeyType="done"
                onSubmitEditing={handleSave}
              />
            </View>
            <Text style={styles.fieldHint}>
              {phone.length > 0 && !isPhoneValid
                ? 'Informe DDD + número do celular.'
                : 'Seu personal usa este número para falar com você pelo WhatsApp.'}
            </Text>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.saveBtn, isPhoneValid && styles.saveBtnActive]}
              onPress={handleSave}
              disabled={!isPhoneValid || loading}
              activeOpacity={0.85}
            >
              <Text style={[styles.saveBtnText, isPhoneValid && styles.saveBtnTextActive]}>
                {loading ? 'Salvando…' : 'Salvar e continuar'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={signOut} disabled={loading} style={styles.signOutRow} activeOpacity={0.7}>
              <Text style={styles.signOutText}>
                Não é você?{' '}
                <Text style={styles.signOutLink}>Sair da conta</Text>
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
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
    minHeight: 60,
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
    marginBottom: 12,
  },
  titleAccent: {
    color: A.primary,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: A.text2,
    marginBottom: 32,
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
  fieldHint: {
    fontSize: 12,
    color: A.text3,
    marginTop: 6,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 12,
  },
  saveBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: A.s1,
    borderWidth: 1,
    borderColor: A.ghostHi,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  },
  saveBtnActive: {
    opacity: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: A.text2,
  },
  saveBtnTextActive: {
    color: A.text,
  },
  signOutRow: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  signOutText: {
    fontSize: 13,
    color: A.text2,
  },
  signOutLink: {
    color: A.primary,
    fontWeight: '600',
  },
});
