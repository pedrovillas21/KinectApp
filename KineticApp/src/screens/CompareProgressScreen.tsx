import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, StyleSheet, View } from 'react-native';

import { Avatar, BarChart12w, Button, Screen, SectionHeader, StackHeader, Text } from '../components/ui';
import { getCompareProgress, httpStatus } from '../services/profileService';
import { FONT, KINETIC, RADIUS } from '../theme/kinetic';
import { formatBestSet, formatMinutes, formatThousands, monthLabels } from '../utils/formatters';
import type { MainStackScreenProps } from '../navigation/types';
import type { BestSet, CompareProgress } from '../types';

/** Cores dos dois lados: ciano (você) × âmbar (amigo) — diferem também em luminosidade. */
const ME_COLOR = KINETIC.primary;
const FRIEND_COLOR = KINETIC.record;

type LoadError = 'forbidden' | 'self' | 'failed';

const ERROR_TEXT: Record<LoadError, string> = {
  forbidden: 'Vocês precisam ser amigos para comparar o progresso.',
  self: 'Escolha um amigo para comparar.',
  failed: 'Não foi possível carregar a comparação.',
};

/** Carga comparável de uma melhor série (peso corporal compara por repetições). */
const setScore = (s: BestSet) => (s.weightKg > 0 ? s.weightKg * 1000 + s.reps : s.reps);

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text variant="caption" color={KINETIC.textDim} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/** Linha "métrica | você | amigo" com o maior valor em destaque. */
function MetricRow({ label, me, friend, format }: { label: string; me: number; friend: number; format: (n: number) => string }) {
  const meWins = me > friend;
  const friendWins = friend > me;
  return (
    <View style={styles.metricRow} accessible accessibilityLabel={`${label}: você ${format(me)}, amigo ${format(friend)}`}>
      <Text variant="body" color={KINETIC.textDim} style={styles.metricLabel}>
        {label}
      </Text>
      <Text style={[styles.metricValue, meWins && styles.metricWin]} color={meWins ? ME_COLOR : KINETIC.text}>
        {format(me)}
      </Text>
      <Text style={[styles.metricValue, friendWins && styles.metricWin]} color={friendWins ? FRIEND_COLOR : KINETIC.text}>
        {format(friend)}
      </Text>
    </View>
  );
}

export default function CompareProgressScreen({ navigation, route }: MainStackScreenProps<'CompareProgress'>) {
  const { friendId } = route.params;
  const [data, setData] = useState<CompareProgress | null>(null);
  const [error, setError] = useState<LoadError | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await getCompareProgress(friendId));
      setError(null);
    } catch (e) {
      const status = httpStatus(e);
      setError(status === 403 ? 'forbidden' : status === 400 ? 'self' : 'failed');
    }
  }, [friendId]);

  useEffect(() => {
    load();
  }, [load]);

  const header = <StackHeader title="Comparar progresso" onBack={() => navigation.goBack()} />;

  if (!data) {
    return (
      <Screen scroll={false} edges={['top', 'bottom', 'left', 'right']} header={header} contentStyle={styles.center}>
        {error ? (
          <View style={styles.message}>
            <Text variant="body" color={KINETIC.textDim} style={styles.centerText}>
              {ERROR_TEXT[error]}
            </Text>
            {error === 'failed' ? <Button label="Tentar de novo" size="md" block={false} onPress={load} /> : null}
          </View>
        ) : (
          <ActivityIndicator color={KINETIC.primary} />
        )}
      </Screen>
    );
  }

  const { me, friend } = data;
  const friendFirst = friend.name.split(' ')[0];
  const sum = (v: number[]) => v.reduce((a, b) => a + b, 0);
  const plain = (n: number) => String(n);

  return (
    <Screen
      edges={['top', 'bottom', 'left', 'right']}
      header={header}
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
    >
      <View style={styles.versus}>
        <View style={styles.side}>
          <Avatar name={me.name} uri={me.avatarUrl} seed={me.id} size={56} />
          <Text variant="bodyStrong" color={ME_COLOR}>
            Você
          </Text>
        </View>
        <Text variant="caption" color={KINETIC.textMuted}>
          vs
        </Text>
        <View style={styles.side}>
          <Avatar name={friend.name} uri={friend.avatarUrl} seed={friend.id} size={56} />
          <Text variant="bodyStrong" color={FRIEND_COLOR} numberOfLines={1}>
            {friendFirst}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text variant="captionStrong" color={KINETIC.textSecondary}>
          Tempo de treino por semana
        </Text>
        <View style={styles.totals}>
          <View style={styles.flex}>
            <Text variant="stat" color={ME_COLOR}>
              {formatMinutes(sum(me.weeklyMinutes))}
            </Text>
            <Text variant="caption" color={KINETIC.textSecondary}>
              você em 12 semanas
            </Text>
          </View>
          <View style={styles.flex}>
            <Text variant="stat" color={FRIEND_COLOR}>
              {formatMinutes(sum(friend.weeklyMinutes))}
            </Text>
            <Text variant="caption" color={KINETIC.textSecondary} numberOfLines={1}>
              {friendFirst} em 12 semanas
            </Text>
          </View>
        </View>
        {sum(me.weeklyMinutes) + sum(friend.weeklyMinutes) === 0 ? (
          <Text variant="body" color={KINETIC.textSecondary} style={styles.chart}>
            Nenhum de vocês treinou nas últimas 12 semanas.
          </Text>
        ) : (
          <View style={styles.chart}>
            <BarChart12w
              series={[
                { values: me.weeklyMinutes, color: ME_COLOR },
                { values: friend.weeklyMinutes, color: FRIEND_COLOR },
              ]}
              labels={monthLabels(data.weekStarts)}
              accessibilityLabel={`Minutos por semana nas últimas 12 semanas: você ${formatMinutes(
                sum(me.weeklyMinutes),
              )} no total, ${friendFirst} ${formatMinutes(sum(friend.weeklyMinutes))}`}
            />
          </View>
        )}
        <View style={styles.legend}>
          <Legend color={ME_COLOR} label="Você" />
          <Legend color={FRIEND_COLOR} label={friendFirst} />
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.metricRow}>
          <View style={styles.metricLabel} />
          <Text variant="captionStrong" color={ME_COLOR} style={styles.metricHead}>
            Você
          </Text>
          <Text variant="captionStrong" color={FRIEND_COLOR} style={styles.metricHead} numberOfLines={1}>
            {friendFirst}
          </Text>
        </View>
        <MetricRow label="Treinos no mês" me={me.monthSessions} friend={friend.monthSessions} format={plain} />
        <MetricRow
          label="Sequência"
          me={me.streakDays}
          friend={friend.streakDays}
          format={(n) => `${n} ${n === 1 ? 'dia' : 'dias'}`}
        />
        <MetricRow label="Total de treinos" me={me.totalSessions} friend={friend.totalSessions} format={plain} />
        <MetricRow
          label="Volume 30 dias"
          me={me.volume30dKg}
          friend={friend.volume30dKg}
          format={(n) => `${formatThousands(n)} kg`}
        />
      </View>

      <View style={styles.prs}>
        <SectionHeader
          title="Recordes em comum"
          caption={data.sharedPrs.length > 0 ? 'Exercícios que vocês dois já fizeram' : undefined}
        />
        {data.sharedPrs.length === 0 ? (
          <Text variant="body" color={KINETIC.textSecondary} style={styles.prEmpty}>
            Vocês ainda não têm exercícios em comum.
          </Text>
        ) : (
          <View style={styles.prList}>
            {data.sharedPrs.map((pr) => {
              const a = setScore(pr.me);
              const b = setScore(pr.friend);
              return (
                <View
                  key={pr.exercise}
                  style={styles.prRow}
                  accessible
                  accessibilityLabel={`${pr.exercise}: você ${formatBestSet(pr.me)}, ${friendFirst} ${formatBestSet(pr.friend)}`}
                >
                  <Text variant="body" numberOfLines={2} style={styles.flex}>
                    {pr.exercise}
                  </Text>
                  <Text variant="mono" color={a > b ? ME_COLOR : KINETIC.textDim} style={styles.prValue}>
                    {formatBestSet(pr.me)}
                  </Text>
                  <Text variant="mono" color={b > a ? FRIEND_COLOR : KINETIC.textDim} style={styles.prValue}>
                    {formatBestSet(pr.friend)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  message: { alignItems: 'center', gap: 12, paddingHorizontal: 32 },
  centerText: { textAlign: 'center' },
  flex: { flex: 1 },
  versus: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, paddingVertical: 16 },
  side: { alignItems: 'center', gap: 6, width: 110 },
  card: { marginHorizontal: 16, marginTop: 12, padding: 16, borderRadius: RADIUS.xl, backgroundColor: KINETIC.surface1 },
  totals: { flexDirection: 'row', gap: 12, marginTop: 10 },
  chart: { marginTop: 16 },
  legend: { flexDirection: 'row', gap: 16, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 2 },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    gap: 8,
  },
  metricLabel: { flex: 1.4 },
  metricHead: { flex: 1, textAlign: 'right' },
  metricValue: { flex: 1, textAlign: 'right', fontFamily: FONT.monoMedium, fontSize: 14, lineHeight: 18 },
  metricWin: { fontFamily: FONT.monoSemibold },
  prs: { marginTop: 22 },
  prEmpty: { paddingHorizontal: 20, paddingTop: 8 },
  prList: { paddingHorizontal: 20, marginTop: 8 },
  prRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 46,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  prValue: { width: 82, textAlign: 'right' },
});
