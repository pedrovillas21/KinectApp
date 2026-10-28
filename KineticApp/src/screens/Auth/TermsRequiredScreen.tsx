import React, { useContext, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Text } from '../../components/ui/scaled';
import { AuthContext } from '../../contexts/AuthContext';
import { showAlert } from '../../components/ui/AlertHost';
import { PRIVACY_URL, TERMS_URL, openLegal } from '../../config/legal';
import { KINETIC } from '../../theme/kinetic';

// Conta criada pelo personal/empresa, ou termos atualizados: o app só libera depois do
// aceite da versão vigente (o backend também barra a API até lá). Sem "voltar".
export default function TermsRequiredScreen() {
  const { acceptTerms, signOut } = useContext(AuthContext);
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    if (!checked || loading) return;
    setLoading(true);
    const result = await acceptTerms();
    setLoading(false);
    // Sucesso: o AuthContext atualiza o usuário e o roteamento libera o app sozinho.
    if (!result.success) {
      showAlert('Erro', result.error);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Antes de continuar</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>
            {'Termos e\n'}
            <Text style={styles.titleAccent}>privacidade</Text>
          </Text>
          <Text style={styles.subtitle}>
            Para usar o Kinetic, leia e aceite a versão atual dos nossos termos. Eles explicam quais dados usamos,
            com quem compartilhamos, por quanto tempo guardamos e como você exerce seus direitos.
          </Text>

          <TouchableOpacity onPress={() => openLegal(TERMS_URL)} style={styles.linkRow} activeOpacity={0.7}>
            <Text style={styles.link}>Ler os Termos de Uso</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openLegal(PRIVACY_URL)} style={styles.linkRow} activeOpacity={0.7}>
            <Text style={styles.link}>Ler a Política de Privacidade</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkRow}
            onPress={() => setChecked(!checked)}
            activeOpacity={0.7}
            accessibilityRole="checkbox"
            accessibilityState={{ checked }}
          >
            <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
              {checked && (
                <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                  <Path d="M20 6L9 17l-5-5" stroke={KINETIC.bg} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              )}
            </View>
            <Text style={styles.checkLabel}>
              Li e aceito os Termos de Uso e a Política de Privacidade, inclusive o uso dos meus dados de saúde
              (peso, medidas, lesões e treinos) para montar e acompanhar meus treinos.
            </Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveBtn, checked && styles.saveBtnActive]}
            onPress={handleAccept}
            disabled={!checked || loading}
            activeOpacity={0.85}
          >
            <Text style={[styles.saveBtnText, checked && styles.saveBtnTextActive]}>
              {loading ? 'Salvando…' : 'Aceitar e continuar'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={signOut} disabled={loading} style={styles.signOutRow} activeOpacity={0.7}>
            <Text style={styles.signOutText}>
              Não quer aceitar? <Text style={styles.signOutLink}>Sair da conta</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: KINETIC.bg },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
    minHeight: 60,
  },
  headerText: { fontSize: 13, color: KINETIC.textDim, fontWeight: '500' },
  content: { paddingHorizontal: 24, paddingBottom: 8 },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: KINETIC.text,
    letterSpacing: -1,
    lineHeight: 44,
    marginTop: 12,
    marginBottom: 12,
  },
  titleAccent: { color: KINETIC.primary },
  subtitle: { fontSize: 14, lineHeight: 21, color: KINETIC.textDim, marginBottom: 20 },
  linkRow: { paddingVertical: 10 },
  link: { fontSize: 15, fontWeight: '600', color: KINETIC.primary },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 20 },
  checkbox: {
    width: 20,
    height: 20,
    marginTop: 2,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: KINETIC.ghostHi,
    backgroundColor: KINETIC.surface1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: KINETIC.primary, borderColor: KINETIC.primary },
  checkLabel: { flex: 1, fontSize: 13, lineHeight: 19, color: KINETIC.textDim },
  footer: { paddingHorizontal: 24, paddingBottom: 16, gap: 12 },
  saveBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: KINETIC.surface1,
    borderWidth: 1,
    borderColor: KINETIC.ghostHi,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  },
  saveBtnActive: { opacity: 1, borderColor: 'rgba(255,255,255,0.2)' },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: KINETIC.textDim },
  saveBtnTextActive: { color: KINETIC.text },
  signOutRow: { alignItems: 'center', paddingVertical: 4 },
  signOutText: { fontSize: 13, color: KINETIC.textDim },
  signOutLink: { color: KINETIC.primary, fontWeight: '600' },
});
