import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { KINETIC, rankingPositionChipBg, rankingPositionColor } from '../../theme/kinetic';
import type { RankingEntryDTO } from '../../types';

interface RankingCardProps {
  items: RankingEntryDTO[];
  onPressViewAll?: () => void;
}

interface RankingRowProps {
  item: RankingEntryDTO;
  isFirst: boolean;
}

function RankingRow({ item, isFirst }: RankingRowProps) {
  const posColor = rankingPositionColor(item.position);
  const chipBg = rankingPositionChipBg(item.position);
  const deltaPositive = item.delta > 0;
  const deltaNeutral = item.delta === 0;
  const avatarLetter = item.name.charAt(0).toUpperCase();

  return (
    <View
      style={[
        styles.row,
        !isFirst && styles.rowDivider,
        item.isCurrentUser && styles.rowUser,
      ]}
    >
      <View style={[styles.posChip, { backgroundColor: chipBg }]}>
        <Text style={[styles.posText, { color: posColor }]}>{item.position}º</Text>
      </View>

      <View
        style={[
          styles.avatar,
          item.isCurrentUser ? styles.avatarUser : styles.avatarDefault,
        ]}
      >
        <Text
          style={[
            styles.avatarLetter,
            item.isCurrentUser && styles.avatarLetterUser,
          ]}
        >
          {avatarLetter}
        </Text>
      </View>

      <View style={styles.info}>
        <Text
          style={[styles.name, item.isCurrentUser && styles.nameUser]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <View style={styles.subRow}>
          <Text style={styles.minutes}>{item.minutes} min</Text>
          <Text
            style={[
              styles.delta,
              { color: deltaPositive ? KINETIC.success : deltaNeutral ? KINETIC.textDim : KINETIC.warn },
            ]}
          >
            {deltaPositive ? '↑' : deltaNeutral ? '→' : '↓'}
            {Math.abs(item.delta)} vs semana passada
          </Text>
        </View>
      </View>

      {item.isCurrentUser ? (
        <View style={styles.userBadge}>
          <Text style={styles.userBadgeText}>Você</Text>
        </View>
      ) : (
        <View
          style={[
            styles.onlineDot,
            item.online ? styles.onlineDotActive : styles.onlineDotOff,
          ]}
        />
      )}
    </View>
  );
}

export default function RankingCard({ items, onPressViewAll }: RankingCardProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Ranking da Arena</Text>
          <Text style={styles.subtitle}>Competição semanal · minutos na arena</Text>
        </View>
        {onPressViewAll && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver tudo"
            onPress={onPressViewAll}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Text style={styles.viewAll}>Ver tudo</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.list}>
        {items.map((item, idx) => (
          <RankingRow key={item.id} item={item} isFirst={idx === 0} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginTop: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerText: {
    flexShrink: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: KINETIC.text,
    letterSpacing: -0.2,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 11,
    color: KINETIC.textDim,
  },
  viewAll: {
    fontSize: 11,
    fontWeight: '600',
    color: KINETIC.primary,
  },
  list: {
    backgroundColor: KINETIC.surface1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: KINETIC.ghost,
  },
  rowUser: {
    backgroundColor: KINETIC.primaryDim,
  },
  posChip: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  posText: {
    fontSize: 12,
    fontWeight: '800',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  avatarDefault: {
    backgroundColor: KINETIC.surface2,
    borderColor: KINETIC.ghost,
  },
  avatarUser: {
    backgroundColor: KINETIC.primarySoft,
    borderColor: KINETIC.primary,
  },
  avatarLetter: {
    fontSize: 13,
    fontWeight: '700',
    color: KINETIC.textDim,
  },
  avatarLetterUser: {
    color: KINETIC.primary,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: KINETIC.text,
  },
  nameUser: {
    fontStyle: 'italic',
    fontWeight: '700',
    color: KINETIC.primary,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  minutes: {
    fontSize: 11,
    color: KINETIC.textDim,
  },
  delta: {
    fontSize: 10,
    fontWeight: '700',
  },
  userBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: KINETIC.primaryDim,
  },
  userBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: KINETIC.primary,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  onlineDotActive: {
    backgroundColor: KINETIC.success,
    shadowColor: KINETIC.success,
    shadowOpacity: 0.7,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
  onlineDotOff: {
    backgroundColor: KINETIC.ghost,
  },
});
