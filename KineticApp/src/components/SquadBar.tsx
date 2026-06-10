import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Animated,
  ListRenderItem,
} from 'react-native';
import { COLORS } from '../theme/colors';
import { presenceColor } from '../theme/kinetic';
import type { SquadMember } from '../types';

interface Props {
  items: SquadMember[];
  onAddPress?: () => void;
  onFindPress?: () => void;
  onMemberPress?: (member: SquadMember) => void;
}

function PulsingRing({ color }: { color: string }) {
  const opacity = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[StyleSheet.absoluteFillObject, styles.pulseRing, { borderColor: color, opacity }]}
    />
  );
}

export default function SquadBar({ items, onAddPress, onFindPress, onMemberPress }: Props) {
  const renderItem: ListRenderItem<SquadMember> = ({ item }) => {
    const ringColor = presenceColor(item.status);
    const isTraining = item.status === 'TRAINING';
    const avatar = item.avatarUrl ?? `https://i.pravatar.cc/150?u=${item.id}`;

    return (
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => onMemberPress?.(item)}
        activeOpacity={0.75}
      >
        <View style={[styles.avatarWrap, { borderColor: ringColor }]}>
          {isTraining && <PulsingRing color={ringColor} />}
          <Image source={{ uri: avatar }} style={styles.avatarImage} />
        </View>
        <Text style={styles.avatarName} numberOfLines={1}>
          {item.nome.split(' ')[0]}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderSearchButton = () => (
    <View style={styles.itemContainer}>
      <TouchableOpacity style={styles.actionWrap} onPress={onFindPress}>
        <Text style={styles.actionIcon}>🔍</Text>
      </TouchableOpacity>
      <Text style={styles.avatarName}>Find</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Squad</Text>
        <TouchableOpacity onPress={onAddPress}>
          <Text style={styles.addText}>Add +</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListFooterComponent={renderSearchButton}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  addText: { color: '#CCC', fontSize: 12, fontWeight: 'bold' },
  listContent: { paddingHorizontal: 20 },
  itemContainer: { alignItems: 'center', marginRight: 16, width: 64 },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  pulseRing: {
    borderRadius: 32,
    borderWidth: 2,
    margin: -2,
  },
  avatarImage: { width: 56, height: 56, borderRadius: 28 },
  actionWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionIcon: { fontSize: 20, color: '#CCC' },
  avatarName: { color: '#CCC', fontSize: 11, fontWeight: 'bold' },
});
