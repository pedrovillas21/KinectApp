import React from 'react';
import { FlatList, ListRenderItem, Pressable, StyleSheet, View } from 'react-native';
import { KINETIC } from '../theme/kinetic';
import type { SquadMember } from '../types';
import Icon from './Icon';
import { Avatar, Text } from './ui';

interface Props {
  items: SquadMember[];
  /** Usuário logado: o primeiro círculo é a foto dele com o "+" no canto. */
  me?: { id: string; nome: string; avatarUrl?: string | null } | null;
  /** Ids de membros com story ativa — recebem anel ciano e abrem o visualizador. */
  storyUserIds?: string[];
  onAddStory?: () => void;
  onOpenStory?: (userId: string) => void;
  /** Toque em quem não tem story → perfil. */
  onMemberPress?: (member: SquadMember) => void;
}

const SIZE = 68;
const BADGE = 24;

/** Faixa de stories compacta: "Seu story" + amigos (ciano = story nova, verde = treinando agora). */
export default function SquadBar({ items, me, storyUserIds, onAddStory, onOpenStory, onMemberPress }: Props) {
  const renderItem: ListRenderItem<SquadMember> = ({ item }) => {
    const hasStory = storyUserIds?.includes(item.id) ?? false;
    const training = item.status === 'TRAINING';
    const firstName = item.nome.split(' ')[0];
    const label = `${item.nome}${hasStory ? ', story nova' : ''}${training ? ', treinando agora' : ''}`;

    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        style={styles.item}
        onPress={() => (hasStory ? onOpenStory?.(item.id) : onMemberPress?.(item))}
      >
        <Avatar
          name={item.nome}
          uri={item.avatarUrl || null}
          seed={item.id}
          size={SIZE}
          ring={hasStory ? 'unseen' : training ? 'live' : undefined}
        />
        <Text variant="caption" color={KINETIC.textDim} numberOfLines={1} style={styles.name}>
          {firstName}
        </Text>
      </Pressable>
    );
  };

  // Estilo Instagram: tocar na foto vê a própria story (se houver); o "+" do canto sempre cria uma nova.
  const renderMine = () => {
    const mineHasStory = !!me && (storyUserIds?.includes(me.id) ?? false);
    return (
      <View style={styles.item}>
        <View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={mineHasStory ? 'Ver seu story' : 'Publicar story'}
            onPress={() => (mineHasStory && me ? onOpenStory?.(me.id) : onAddStory?.())}
          >
            <Avatar name={me?.nome} uri={me?.avatarUrl || null} seed={me?.id} size={SIZE} ring={mineHasStory ? 'unseen' : undefined} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Publicar story"
            onPress={onAddStory}
            hitSlop={10}
            style={({ pressed }) => [styles.badge, pressed && styles.pressed]}
          >
            <Icon name="plus" size={14} color={KINETIC.onPrimary} strokeWidth={2.6} />
          </Pressable>
        </View>
        <Text variant="caption" color={KINETIC.textDim} numberOfLines={1} style={styles.name}>
          Seu story
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderMine}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: KINETIC.hairline },
  list: { paddingHorizontal: 20, gap: 14 },
  item: { width: SIZE + 4, alignItems: 'center', gap: 6 },
  badge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: BADGE,
    height: BADGE,
    borderRadius: BADGE / 2,
    borderWidth: 3,
    borderColor: KINETIC.bg,
    backgroundColor: KINETIC.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.85 },
  name: { maxWidth: SIZE + 4 },
});
