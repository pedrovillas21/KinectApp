import React from 'react';
import { FlatList, ListRenderItem, Pressable, StyleSheet, View } from 'react-native';
import { KINETIC } from '../theme/kinetic';
import type { SquadMember } from '../types';
import Icon from './Icon';
import { Avatar, Text } from './ui';

interface Props {
  items: SquadMember[];
  /** Ids de membros com story ativa — recebem anel ciano e abrem o visualizador. */
  storyUserIds?: string[];
  onAddStory?: () => void;
  onOpenStory?: (userId: string) => void;
  /** Toque em quem não tem story → perfil. */
  onMemberPress?: (member: SquadMember) => void;
}

const SIZE = 52;

/** Faixa de stories compacta: "Seu story" + amigos (ciano = story nova, verde = treinando agora). */
export default function SquadBar({ items, storyUserIds, onAddStory, onOpenStory, onMemberPress }: Props) {
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
        <Text variant="micro" color={KINETIC.textDim} numberOfLines={1} style={styles.name}>
          {firstName}
        </Text>
      </Pressable>
    );
  };

  const renderStoryButton = () => (
    <Pressable accessibilityRole="button" accessibilityLabel="Publicar story" style={styles.item} onPress={onAddStory}>
      <View style={styles.addStory}>
        <Icon name="plus" size={18} color={KINETIC.primary} strokeWidth={2} />
      </View>
      <Text variant="micro" color={KINETIC.textDim} numberOfLines={1} style={styles.name}>
        Seu story
      </Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderStoryButton}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: KINETIC.hairline },
  list: { paddingHorizontal: 20, gap: 14 },
  item: { width: 56, alignItems: 'center', gap: 6 },
  addStory: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: KINETIC.surface1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { maxWidth: 56 },
});
