import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, View } from 'react-native';

import { Avatar, BarChart12w, Button, Screen, SectionHeader, StackHeader, Text } from '../components/ui';
import { getCompareProgress, httpStatus } from '../services/profileService';
import { FONT, RADIUS } from '../theme/kinetic';
import { formatBestSet, formatMinutes, formatThousands, monthLabels } from '../utils/formatters';
import type { MainStackScreenProps } from '../navigation/types';
import type { BestSet, CompareProgress } from '../types';
import { createStyles, useColors } from '../theme/ThemeContext';

type LoadError = 'forbidden' | 'self' | 'failed';

const ERROR_TEXT: Record<LoadError, string> = {
  forbidden: 'Vocês precisam ser amigos para comparar o progresso.',
  self: 'Escolha um amigo para comparar.',
  failed: 'Não foi possível carregar a comparação.',
};

/** Carga comparável de uma melhor série (peso corporal compara por repetições). */
const setScore = (s: BestSet) => (s.weightKg > 0 ? s.weightKg * 1000 + s.reps : s.reps);

function Legend({ color, label }: { color: string; label: string }) {
  const styles = useStyles();
  const c = useColors();
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text variant="caption" color={c.textDim} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/** Linha "métrica | você | amigo" com o maior valor em destaque. */
// Cores dos dois lados: ciano (você, c.primary) × âmbar (amigo, c.record) — diferem também em luminosidade.
function MetricRow({ label, me, friend, format }: { label: string; me: number; friend: number; format: (n: number) => string }) {
  const styles = useStyles();
  const c = useColors();
  const meWins = me > friend;
  const friendWins = friend > me;
  return (
    <View style={styles.metricRow} accessible accessibilityLabel={`${label}: você ${format(me)}, amigo ${format(friend)}`}>
      <Text variant="body" color={c.textDim} style={styles.metricLabel}>
        {label}
      </Text>
      <Text style={[styles.metricValue, meWins && styles.metricWin]} color={meWins ? c.primary : c.text}>
        {format(me)}
      </Text>
      <Text style={[styles.metricValue, friendWins && styles.metricWin]} color={friendWins ? c.record : c.text}>
        {format(friend)}
      </Text>
    </View>
  );
}

export default function CompareProgressScreen({ navigation, route }: MainStackScreenProps<'CompareProgress'>) {
  const styles = useStyles();
  const c = useColors();
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
            <Text variant="body" color={c.textDim} style={styles.centerText}>
              {ERROR_TEXT[error]}
            </Text>
            {error === 'failed' ? <Button label="Tentar de novo" size="md" block={false} onPress={load} /> : null}
          </View>
        ) : (
          <ActivityIndicator color={c.primary} />
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
          tintColor={c.primary}
        />
      }
    >
      <View style={styles.versus}>
        <View style={styles.side}>
          <Avatar name={me.name} uri={me.avatarUrl} seed={me.id} size={56} />
          <Text variant="bodyStrong" color={c.primary}>
            Você
          </Text>
        </View>
        <Text variant="caption" color={c.textMuted}>
          vs
        </Text>
        <View style={styles.side}>
          <Avatar name={friend.name} uri={friend.avatarUrl} seed={friend.id} size={56} />
          <Text variant="bodyStrong" color={c.record} numberOfLines={1}>
            {friendFirst}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text variant="captionStrong" color={c.textSecondary}>
          Tempo de treino por semana
        </Text>
        <View style={styles.totals}>
          <View style={styles.flex}>
            <Text variant="stat" color={c.primary}>
              {formatMinutes(sum(me.weeklyMinutes))}
            </Text>
            <Text variant="caption" color={c.textSecondary}>
              você em 12 semanas
            </Text>
          </View>
          <View style={styles.flex}>
            <Text variant="stat" color={c.record}>
              {formatMinutes(sum(friend.weeklyMinutes))}
            </Text>
            <Text variant="caption" color={c.textSecondary} numberOfLines={1}>
              {friendFirst} em 12 semanas
            </Text>
          </View>
        </View>
        {sum(me.weeklyMinutes) + sum(friend.weeklyMinutes) === 0 ? (
          <Text variant="body" color={c.textSecondary} style={styles.chart}>
            Nenhum de vocês treinou nas últimas 12 semanas.
          </Text>
        ) : (
          <View style={styles.chart}>
            <BarChart12w
              series={[
                { values: me.weeklyMinutes, color: c.primary },
                { values: friend.weeklyMinutes, color: c.record },
              ]}
              labels={monthLabels(data.weekStarts)}
              accessibilityLabel={`Minutos por semana nas últimas 12 semanas: você ${formatMinutes(
                sum(me.weeklyMinutes),
              )} no total, ${friendFirst} ${formatMinutes(sum(friend.weeklyMinutes))}`}
            />
          </View>
        )}
        <View style={styles.legend}>
          <Legend color={c.primary} label="Você" />
          <Legend color={c.record} label={friendFirst} />
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.metricRow}>
          <View style={styles.metricLabel} />
          <Text variant="captionStrong" color={c.primary} style={styles.metricHead}>
            Você
          </Text>
          <Text variant="captionStrong" color={c.record} style={styles.metricHead} numberOfLines={1}>
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
          <Text variant="body" color={c.textSecondary} style={styles.prEmpty}>
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
                  <Text variant="mono" color={a > b ? c.primary : c.textDim} style={styles.prValue}>
                    {formatBestSet(pr.me)}
                  </Text>
                  <Text variant="mono" color={b > a ? c.record : c.textDim} style={styles.prValue}>
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

const useStyles = createStyles((c, s) => ({
  center: { alignItems: 'center', justifyContent: 'center' },
  message: { alignItems: 'center', gap: 12, paddingHorizontal: 32 },
  centerText: { textAlign: 'center' },
  flex: { flex: 1 },
  versus: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, paddingVertical: 16 },
  side: { alignItems: 'center', gap: 6, width: 110 },
  card: { ...s.card, marginHorizontal: 16, marginTop: 12, padding: 16, borderRadius: RADIUS.xl, backgroundColor: c.surface1 },
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
    borderBottomColor: c.divider,
  },
  prValue: { width: 82, textAlign: 'right' },
}));
