import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { KINETIC } from '../../theme/kinetic';
import type { PersonalRecord } from '../../types';
import { formatBestSet, formatShortDate } from '../../utils/formatters';
import { SectionHeader, Text } from '../ui';

const COLLAPSED = 3;

/** Recordes pessoais por exercício (3 primeiros, "Ver todos" expande). */
export default function RecordsList({
  records,
  bare = false,
}: {
  records: PersonalRecord[];
  /** Lista completa, sem título nem margem (dentro de um balão). */
  bare?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  if (records.length === 0) return null;
  const shown = expanded || bare ? records : records.slice(0, COLLAPSED);

  const list = (
    <View style={bare ? null : styles.list}>
      {shown.map((r) => (
        <View key={r.exercise} style={styles.row}>
          <Text variant="body" numberOfLines={1} style={styles.name}>
            {r.exercise}
          </Text>
          <Text variant="caption" color={KINETIC.textSecondary}>
            {formatShortDate(r.date)}
          </Text>
          <Text variant="statSmall" style={styles.value}>
            {formatBestSet(r)}
          </Text>
        </View>
      ))}
    </View>
  );
  if (bare) return list;

  return (
    <View>
      <SectionHeader
        title="Recordes pessoais"
        actionLabel={records.length > COLLAPSED ? (expanded ? 'Ver menos' : `Ver todos (${records.length})`) : undefined}
        onAction={() => setExpanded((v) => !v)}
      />
      {list}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { marginTop: 8, paddingHorizontal: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 46,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  name: { flex: 1 },
  value: { fontSize: 14 },
});
