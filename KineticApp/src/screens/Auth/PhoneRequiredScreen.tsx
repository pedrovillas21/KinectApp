import React, { useContext, useState } from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { Text, TextInput } from '../../components/ui/scaled';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../../contexts/AuthContext';
import { isValidCellPhone, maskCellPhone } from '../../utils/whatsapp';
import { showAlert } from '../../components/ui/AlertHost';
import KeyboardAvoider from '../../components/ui/KeyboardAvoider';

import { PhoneIcon } from '../../components/auth/AuthIcons';
import { createStyles, useColors } from '../../theme/ThemeContext';

// Contas criadas antes do celular ser obrigatório caem aqui logo após entrar.
// Não tem "voltar": o app só libera depois do cadastro (ou o usuário sai da conta).
export default function PhoneRequiredScreen() {
  const styles = useStyles();
  const c = useColors();
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
      showAlert('Erro', result.error);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoider style={styles.kav}
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
                placeholderTextColor={c.placeholder}
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
        </KeyboardAvoider>
      </SafeAreaView>
    </View>
  );
}

const useStyles = createStyles((c, s) => ({
  container: { flex: 1, backgroundColor: c.bg },
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
    color: c.textDim,
    fontWeight: '500',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: c.text,
    letterSpacing: -1,
    lineHeight: 44,
    marginTop: 12,
    marginBottom: 12,
  },
  titleAccent: {
    color: c.primary,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: c.textDim,
    marginBottom: 32,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: c.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  inputWrap: { 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: c.surface1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.ghostHi,
    paddingHorizontal: 14,
    height: 52,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: c.text,
    padding: 0,
  },
  fieldHint: {
    fontSize: 12,
    color: c.textMuted,
    marginTop: 6,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 12,
  },
  saveBtn: {
    ...s.card,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: c.surface1,
    borderWidth: 1,
    borderColor: c.ghostHi,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  },
  saveBtnActive: {
    opacity: 1,
    borderColor: c.borderStrong,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: c.textDim,
  },
  saveBtnTextActive: {
    color: c.text,
  },
  signOutRow: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  signOutText: {
    fontSize: 13,
    color: c.textDim,
  },
  signOutLink: {
    color: c.primary,
    fontWeight: '600',
  },
}));
