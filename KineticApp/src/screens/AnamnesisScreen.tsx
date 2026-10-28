import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button, Screen, StackHeader, Text } from '../components/ui';
import { showAlert } from '../components/ui/AlertHost';
import useFocusResource from '../hooks/useFocusResource';
import { confirmMyAnamnesis, getMyProtocol, getMyTrainer } from '../services/trainerService';
import { KINETIC, RADIUS } from '../theme/kinetic';
import { formatDayMonthYear } from '../utils/formatters';
import { openWhatsApp } from '../utils/whatsapp';
import type { MainStackScreenProps } from '../navigation/types';
import type { StudentProtocol } from '../types';

/**
 * Anamnese registrada (na consulta com o personal ou pelo próprio aluno), para o aluno
 * conferir se bate com o que contou. "Está tudo certo" registra a conferência.
 */
export default function AnamnesisScreen({ navigation }: MainStackScreenProps<'Anamnesis'>) {
  const protocolRes = useFocusResource('me/protocol', getMyProtocol);
  const trainerRes = useFocusResource('me/trainer', getMyTrainer);
  const [confirmed, setConfirmed] = useState<StudentProtocol | null>(null);
  const [confirming, setConfirming] = useState(false);

  const header = <StackHeader title="Anamnese" onBack={() => navigation.goBack()} />;
  const p = confirmed ?? protocolRes.data;

  if (!p) {
    return (
      <Screen scroll={false} edges={['top', 'bottom', 'left', 'right']} header={header} contentStyle={styles.center}>
        {protocolRes.error ? (
          <Text variant="body" color={KINETIC.textSecondary}>
            Não foi possível carregar sua anamnese.
          </Text>
        ) : (
          <ActivityIndicator color={KINETIC.primary} />
        )}
      </Screen>
    );
  }

  const trainerName = p.managedByName?.split(' ')[0] ?? null;
  const phone = trainerRes.data?.peer.phone ?? null;
  const text = p.medicalConditions?.trim() || null;
  const date = formatDayMonthYear(p.anamnesisUpdatedAt);
  const author = p.anamnesisUpdatedByStudent ? 'você' : p.anamnesisUpdatedByName?.split(' ')[0];
  const origin = author && date ? `Registrada por ${author} · ${date}` : author ? `Registrada por ${author}` : null;
  const confirmedOn = formatDayMonthYear(p.anamnesisConfirmedAt);

  const confirm = async () => {
    setConfirming(true);
    try {
      setConfirmed(await confirmMyAnamnesis());
    } catch {
      showAlert('Erro', 'Não foi possível registrar a conferência agora. Tente novamente.');
    } finally {
      setConfirming(false);
    }
  };

  const talkToTrainer = () => {
    if (!phone) return;
    openWhatsApp(phone, `Oi, ${trainerName}! Conferi minha anamnese no app e algo não está de acordo com o que conversamos.`);
  };

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']} header={header} contentStyle={styles.content}>
      <View style={styles.meta}>
        <View style={[styles.badge, { backgroundColor: text ? KINETIC.successBg : 'rgba(255,255,255,0.06)' }]}>
          <Text variant="micro" color={text ? KINETIC.success : KINETIC.textSecondary}>
            {text ? 'Completa' : 'Pendente'}
          </Text>
        </View>
        {origin ? (
          <Text variant="caption" color={KINETIC.textSecondary}>
            {origin}
          </Text>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text variant="captionStrong" color={KINETIC.textSecondary} style={styles.sectionTitle}>
          Lesões e restrições
        </Text>
        <View style={styles.card}>
          <Text variant="body" color={text ? KINETIC.text : KINETIC.textSecondary}>
            {text ?? (trainerName ? `${trainerName} ainda não registrou sua anamnese.` : 'Nenhuma anamnese informada.')}
          </Text>
        </View>
        <Text variant="caption" color={KINETIC.textSecondary} style={styles.sectionTitle}>
          {trainerName
            ? `É isso que ${trainerName} e a IA usam para montar seu treino. Confira se bate com o que você contou na consulta.`
            : 'É isso que a IA usa para montar seu treino.'}
        </Text>
      </View>

      <View style={styles.actions}>
        {text && p.anamnesisConfirmedAt ? (
          <Text variant="caption" color={KINETIC.success} style={styles.center}>
            Você conferiu em {confirmedOn}.
          </Text>
        ) : text ? (
          <Button label="Está tudo certo" icon="check" loading={confirming} onPress={confirm} />
        ) : null}
        {trainerName && phone ? (
          <Button label={`Algo não confere · falar com ${trainerName}`} variant="secondary" onPress={talkToTrainer} />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
  content: { paddingTop: 12, paddingBottom: 32, gap: 20 },
  meta: { marginHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: RADIUS.xs },
  section: { marginHorizontal: 16, gap: 8 },
  sectionTitle: { paddingHorizontal: 4 },
  card: { backgroundColor: KINETIC.surface1, borderRadius: RADIUS.xl, padding: 16 },
  actions: { marginHorizontal: 16, gap: 10 },
});
