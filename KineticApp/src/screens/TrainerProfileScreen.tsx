import React, { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import InviteDialog from '../components/InviteDialog';
import Icon from '../components/Icon';
import ProfileHeader from '../components/profile/ProfileHeader';
import { Button, Screen, SectionHeader, StackHeader, Text } from '../components/ui';
import { endMyTrainerLink, getMyTrainerProfile } from '../services/trainerService';
import useFocusResource from '../hooks/useFocusResource';
import { KINETIC, RADIUS } from '../theme/kinetic';
import { formatRelativeDays } from '../utils/dateRelative';
import { formatMonthShortYear } from '../utils/formatters';
import { whatsappUrl } from '../utils/whatsapp';
import type { MainStackScreenProps } from '../navigation/types';
import type { MyTrainerProfile } from '../types';
import { showAlert } from '../components/ui/AlertHost';

/** Cores das fichas (A, B, C…) na mesma ordem das abas de treino. */
const PLAN_TONES = [
  { bg: 'rgba(0,229,255,0.12)', fg: KINETIC.primary },
  { bg: 'rgba(245,177,61,0.14)', fg: KINETIC.record },
  { bg: 'rgba(74,222,128,0.12)', fg: KINETIC.success },
];

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoRow, !last && styles.divider]}>
      <Text variant="body" color={KINETIC.textDim}>
        {label}
      </Text>
      <Text variant="body" style={styles.infoValue}>
        {value}
      </Text>
    </View>
  );
}

/** "Seu personal": perfil profissional, fichas que ele montou, WhatsApp e encerrar vínculo. */
export default function TrainerProfileScreen({ navigation }: MainStackScreenProps<'TrainerProfile'>) {
  const [refreshing, setRefreshing] = useState(false);
  const [ending, setEnding] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  const res = useFocusResource('me/trainer-profile', () => getMyTrainerProfile());
  const data: MyTrainerProfile | null = res.data ?? null;
  const state: 'loading' | 'ready' | 'none' | 'failed' = data
    ? 'ready'
    : res.loading
    ? 'loading'
    : res.error
    ? 'failed'
    : 'none';
  const load = res.refresh;

  const header = <StackHeader title="Seu personal" onBack={() => navigation.goBack()} />;

  if (state !== 'ready' || !data) {
    return (
      <Screen scroll={false} edges={['top', 'bottom', 'left', 'right']} header={header} contentStyle={styles.center}>
        {state === 'loading' ? (
          <ActivityIndicator color={KINETIC.primary} />
        ) : (
          <View style={styles.message}>
            <Text variant="bodyStrong">{state === 'none' ? 'Você não tem um personal ativo' : 'Não foi possível carregar'}</Text>
            {state === 'none' ? (
              <Text variant="body" color={KINETIC.textSecondary} style={styles.centerText}>
                Use o código que seu personal enviou ou aceite um convite.
              </Text>
            ) : null}
            <Button
              label={state === 'none' ? 'Adicionar personal' : 'Tentar de novo'}
              size="md"
              block={false}
              onPress={state === 'none' ? () => setInviteOpen(true) : load}
            />
          </View>
        )}
        <InviteDialog
          visible={inviteOpen}
          onClose={() => setInviteOpen(false)}
          initialTab="trainer"
          onChanged={load}
        />
      </Screen>
    );
  }

  const t = data.trainer;
  const firstName = t.nome.trim().split(/\s+/)[0];
  const hasInfo = !!(t.modality || t.schedule || t.location);
  const infoRows = [
    t.modality ? { label: 'Modalidade', value: t.modality } : null,
    t.schedule ? { label: 'Horário', value: t.schedule } : null,
    t.location ? { label: 'Local', value: t.location } : null,
  ].filter((r): r is { label: string; value: string } => r !== null);
  const filledAnything = !!(t.bio || t.specialties.length || t.education.length || hasInfo);
  const lastReview = data.lastReviewAt ? formatRelativeDays(data.lastReviewAt).toLowerCase() : '—';

  const openWhatsApp = () => {
    if (!t.phone) return;
    Linking.openURL(whatsappUrl(t.phone, `Oi, ${firstName}!`)).catch(() =>
      showAlert('WhatsApp', 'Não foi possível abrir o WhatsApp neste aparelho.'),
    );
  };

  const confirmEndLink = () =>
    showAlert(
      'Encerrar vínculo?',
      `${firstName} deixa de acompanhar seus treinos e perde o acesso aos seus dados. Seu histórico de treinos continua com você.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Encerrar',
          style: 'destructive',
          onPress: async () => {
            setEnding(true);
            try {
              await endMyTrainerLink();
              navigation.goBack();
            } catch (e) {
              const err = e as { response?: { data?: unknown } };
              const raw = err.response?.data;
              showAlert('Encerrar vínculo', typeof raw === 'string' && raw ? raw : 'Não foi possível encerrar agora.');
            } finally {
              setEnding(false);
            }
          },
        },
      ],
    );

  return (
    <Screen
      edges={['top', 'bottom', 'left', 'right']}
      header={header}
      contentStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
          tintColor={KINETIC.primary}
        />
      }
      footer={
        t.phone ? (
          <View style={styles.footer}>
            <Button label="Conversar no WhatsApp" icon="comment" variant="whatsapp" onPress={openWhatsApp} />
          </View>
        ) : null
      }
    >
      <ProfileHeader
        name={t.nome}
        avatarUrl={t.avatarUrl}
        seed={t.trainerId}
        lines={['Personal trainer']}
        counters={[
          { label: 'Seu personal desde', value: data.linkedSince ? formatMonthShortYear(data.linkedSince) : '—' },
          { label: 'Fichas ativas', value: data.activePlanCount },
          { label: 'Última revisão', value: lastReview },
        ]}
      />
      {t.cref ? (
        <View style={styles.cref} accessible accessibilityLabel={`CREF ${t.cref}${t.crefVerified ? ', verificado' : ''}`}>
          <Icon name="shield" size={14} color={t.crefVerified ? KINETIC.success : KINETIC.textSecondary} strokeWidth={2} />
          <Text variant="captionStrong" color={t.crefVerified ? KINETIC.success : KINETIC.textSecondary}>
            CREF {t.cref}
            {t.crefVerified ? ' verificado' : ''}
          </Text>
        </View>
      ) : null}

      {!filledAnything ? (
        <Text variant="body" color={KINETIC.textSecondary} style={styles.pending}>
          {firstName} ainda não preencheu o perfil profissional.
        </Text>
      ) : null}

      {t.bio ? (
        <View style={styles.section}>
          <Text variant="headline">Sobre</Text>
          <Text variant="body" color={KINETIC.textDim} style={styles.bio}>
            {t.bio}
          </Text>
        </View>
      ) : null}

      {t.specialties.length > 0 ? (
        <View style={styles.section}>
          <Text variant="headline">Especialidades</Text>
          <View style={styles.chips}>
            {t.specialties.map((s) => (
              <View key={s} style={styles.chip}>
                <Text variant="body">{s}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {t.education.length > 0 ? (
        <View style={styles.section}>
          <Text variant="headline">Formação e certificações</Text>
          <View>
            {t.education.map((e, i) => (
              <View key={`${e.title}-${i}`} style={[styles.eduRow, i < t.education.length - 1 && styles.divider]}>
                <Text variant="body">{e.title}</Text>
                {e.detail ? (
                  <Text variant="caption" color={KINETIC.textSecondary}>
                    {e.detail}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {infoRows.length > 0 ? (
        <View style={styles.section}>
          <Text variant="headline">Atendimento</Text>
          <View>
            {infoRows.map((r, i) => (
              <InfoRow key={r.label} label={r.label} value={r.value} last={i === infoRows.length - 1} />
            ))}
          </View>
        </View>
      ) : null}

      {data.plans.length > 0 ? (
        <View style={styles.plans}>
          <SectionHeader title={`Fichas que ${firstName} montou para você`} style={styles.plansHeader} />
          <View>
            {data.plans.map((p, i) => {
              const tone = PLAN_TONES[i % PLAN_TONES.length];
              const letter = (p.tag || p.title).trim().charAt(0).toUpperCase();
              return (
                <Pressable
                  key={p.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${p.title}, ${p.exerciseCount} exercícios. Abrir fichas`}
                  onPress={() => navigation.navigate('MainTabs', { screen: 'Train' })}
                  style={[styles.planRow, i < data.plans.length - 1 && styles.divider]}
                >
                  <View style={[styles.planBadge, { backgroundColor: tone.bg }]}>
                    <Text variant="captionStrong" color={tone.fg}>
                      {letter}
                    </Text>
                  </View>
                  <Text variant="body" numberOfLines={1} style={styles.flex}>
                    {p.title}
                  </Text>
                  <Text variant="mono" color={KINETIC.textSecondary}>
                    {p.exerciseCount} exerc.
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {data.canEndLink ? (
        <Pressable
          accessibilityRole="button"
          onPress={confirmEndLink}
          disabled={ending}
          hitSlop={6}
          style={styles.endLink}
        >
          <Text variant="body" color={KINETIC.textSecondary} style={styles.underline}>
            {ending ? 'Encerrando…' : 'Encerrar vínculo com este personal'}
          </Text>
        </Pressable>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  message: { alignItems: 'center', gap: 10, paddingHorizontal: 32 },
  centerText: { textAlign: 'center' },
  content: { paddingBottom: 24 },
  flex: { flex: 1 },
  cref: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingTop: 12 },
  pending: { paddingHorizontal: 20, paddingTop: 22 },
  section: { marginTop: 22, marginHorizontal: 20, gap: 8 },
  bio: { lineHeight: 21 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  eduRow: { paddingVertical: 10, gap: 2 },
  divider: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, paddingVertical: 10 },
  infoValue: { flexShrink: 1, textAlign: 'right' },
  plans: { marginTop: 22 },
  plansHeader: { marginBottom: 4 },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48, marginHorizontal: 20 },
  planBadge: { width: 28, height: 28, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  endLink: { marginTop: 16, marginHorizontal: 20, minHeight: 40, justifyContent: 'center', alignSelf: 'flex-start' },
  underline: { textDecorationLine: 'underline' },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: KINETIC.bg,
    borderTopWidth: 1,
    borderTopColor: KINETIC.hairline,
  },
});
