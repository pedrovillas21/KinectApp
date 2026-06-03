import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ListRenderItem } from 'react-native';
import { COLORS } from '../theme/colors';

interface SquadItem {
  id: string;
  name: string;
  avatarUrl: string;
  hasNewUpdate: boolean;
}

interface Props {
  items: SquadItem[];
}

export default function SquadBar({ items }: Props) {
  const renderItem: ListRenderItem<SquadItem> = ({ item }) => (
    <View style={styles.itemContainer}>
      <View style={[styles.avatarWrap, item.hasNewUpdate && styles.avatarNewUpdate]}>
        <Image source={{ uri: item.avatarUrl }} style={styles.avatarImage} />
      </View>
      <Text style={styles.avatarName}>{item.name.split(' ')[0]}</Text>
    </View>
  );

  const renderSearchButton = () => (
    <View style={styles.itemContainer}>
      <TouchableOpacity style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
      </TouchableOpacity>
      <Text style={styles.avatarName}>Find</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Squad</Text>
        <TouchableOpacity>
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
  },
  avatarNewUpdate: { borderColor: COLORS.neonBlue },
  avatarImage: { width: 56, height: 56, borderRadius: 28 },
  searchWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  searchIcon: { fontSize: 20, color: '#CCC' },
  avatarName: { color: '#CCC', fontSize: 11, fontWeight: 'bold' },
});
