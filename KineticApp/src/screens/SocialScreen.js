import React, { useContext, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { ThemeContext } from '../contexts/ThemeContext';
import { COLORS } from '../theme/colors';
import AppHeader from '../components/AppHeader';
import SquadBar from '../components/SquadBar';
import FeedPost from '../components/FeedPost';
import { mockSquad, mockFeed } from '../utils/mockData';

export default function SocialScreen() {
  const { isDarkMode } = useContext(ThemeContext);
  const isDark = isDarkMode;

  const [feedData, setFeedData] = useState(mockFeed);

  const handleOpenCamera = async () => {
    // Pedir permissão
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      alert("Precisamos de permissão para acessar a câmera!");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 5], // aspect ratio retrato parecido com feed
      quality: 0.8,
    });

    if (!result.canceled) {
      // Simula a criação de um novo post
      const newPost = {
        id: 'p' + Math.random().toString(),
        author: { name: 'You', avatarUrl: 'https://i.pravatar.cc/150?u=you' },
        timestamp: 'JUST NOW',
        category: 'CUSTOM WORKOUT',
        imageUrl: result.assets[0].uri,
        duration: '45 MIN',
        calories: '--- KCAL',
        badge: 'JUST FINISHED',
        likesCount: 0,
        commentsCount: 0,
        caption: 'Treino finalizado com sucesso usando o Kinetic! 🚀',
        isLikedByMe: false,
      };

      setFeedData(prev => [newPost, ...prev]);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? COLORS.darkBackground : COLORS.lightBackground }]}>
      <AppHeader />

      <FlatList
        data={feedData}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={<SquadBar items={mockSquad} />}
        renderItem={({ item }) => <FeedPost post={item} />}
      />

      {/* FAB - Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleOpenCamera}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 100, // Espaço pro FAB não cobrir conteúdo
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.neonBlue,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.neonBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    color: COLORS.darkBackground,
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 34,
  }
});
