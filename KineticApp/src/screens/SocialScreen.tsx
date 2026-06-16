import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import * as ImagePicker from 'expo-image-picker';
import { ThemeContext } from '../contexts/ThemeContext';
import { COLORS } from '../theme/colors';
import AppHeader from '../components/AppHeader';
import SquadBar from '../components/SquadBar';
import FeedPost from '../components/FeedPost';
import UserSearchModal from '../components/UserSearchModal';
import ConnectionRequestsModal from '../components/ConnectionRequestsModal';
import CommentsSheet from '../components/CommentsSheet';
import NewPostModal from '../components/NewPostModal';
import StoryViewer from '../components/StoryViewer';
import useSquadStatus from '../hooks/useSquadStatus';
import {
  getFeed,
  likePost,
  unlikePost,
  getSquad,
  getPendingRequests,
  acceptConnection,
  removeConnection,
  getStories,
  createStory,
  uploadMedia,
} from '../services/socialService';
import type { FeedPostData, SquadMember, PendingRequest, StoryGroup } from '../types';

export default function SocialScreen() {
  const { isDarkMode } = useContext(ThemeContext);
  const tabBarHeight = useBottomTabBarHeight();

  const [feed, setFeed] = useState<FeedPostData[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [showNewPost, setShowNewPost] = useState(false);
  const [squadMembers, setSquadMembers] = useState<SquadMember[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [storyViewerIndex, setStoryViewerIndex] = useState<number | null>(null);

  const liveSquad = useSquadStatus();
  const isFirstMount = useRef(true);

  // Prefer live polling data once available, seed from initial REST load
  useEffect(() => {
    if (liveSquad.length > 0) setSquadMembers(liveSquad);
  }, [liveSquad]);

  const loadFeedPage = async (pageNum: number, reset = false) => {
    if (loadingFeed && !reset) return;
    setLoadingFeed(true);
    try {
      const data = await getFeed(pageNum, 10);
      setFeed((prev) => reset ? data.content : [...prev, ...data.content]);
      setPage(pageNum);
      setHasMore(!data.last);
    } catch {
      // silent
    } finally {
      setLoadingFeed(false);
    }
  };

  const loadSquad = async () => {
    try {
      const data = await getSquad();
      setSquadMembers(data);
    } catch {
      // silent
    }
  };

  const loadRequests = async () => {
    try {
      const data = await getPendingRequests();
      setPendingRequests(data);
    } catch {
      // silent
    }
  };

  const loadStories = async () => {
    try {
      const data = await getStories();
      setStoryGroups(data);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    loadFeedPage(0, true);
    loadSquad();
    loadRequests();
    loadStories();
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadFeedPage(0, true), loadSquad(), loadRequests(), loadStories()]);
    setRefreshing(false);
  }, []);

  // Aceitar conexão: vira amizade → atualiza solicitações, squad e feed.
  const handleAcceptRequest = useCallback(async (requesterId: string) => {
    setPendingRequests((prev) => prev.filter((r) => r.requesterId !== requesterId));
    try {
      await acceptConnection(requesterId);
      await Promise.all([loadSquad(), loadFeedPage(0, true), loadRequests()]);
    } catch {
      loadRequests();
    }
  }, []);

  const handleDeclineRequest = useCallback(async (requesterId: string) => {
    setPendingRequests((prev) => prev.filter((r) => r.requesterId !== requesterId));
    try {
      await removeConnection(requesterId);
    } catch {
      loadRequests();
    }
  }, []);

  const handleEndReached = useCallback(() => {
    if (!loadingFeed && hasMore) {
      loadFeedPage(page + 1);
    }
  }, [loadingFeed, hasMore, page]);

  const handleToggleLike = async (postId: string, liked: boolean): Promise<number> => {
    return liked ? likePost(postId) : unlikePost(postId);
  };

  const handleCommentsCountChange = (postId: string, count: number) => {
    setFeed((prev) =>
      prev.map((p) => p.id === postId ? { ...p, commentsCount: count } : p)
    );
  };

  const handleNewPost = (post: FeedPostData) => {
    setFeed((prev) => [post, ...prev]);
  };

  // Bolha "Seu story": abre a câmera direto e publica uma story efêmera (24h),
  // separada do feed de posts.
  const handleAddStory = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.8,
    });
    if (result.canceled) return;
    try {
      // Sobe ao Storage antes: grava a URL pública (visível p/ o squad em
      // qualquer aparelho) em vez do caminho local do dispositivo.
      const url = await uploadMedia(result.assets[0].uri, 'stories');
      await createStory({ imageUrl: url });
      await loadStories();
    } catch {
      // silent — usuário pode tentar de novo
    }
  };

  const openStory = (userId: string) => {
    const index = storyGroups.findIndex((g) => g.userId === userId);
    if (index >= 0) setStoryViewerIndex(index);
  };

  const handleSearchClose = () => {
    setShowSearchModal(false);
    loadSquad();
    loadRequests();
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? COLORS.darkBackground : COLORS.lightBackground },
      ]}
    >
      <AppHeader
        onPressNotifications={() => setShowRequests(true)}
        hasUnreadNotifications={pendingRequests.length > 0}
      />

      <FlatList
        data={feed}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <SquadBar
            items={squadMembers}
            storyUserIds={storyGroups.map((g) => g.userId)}
            onAddPress={() => setShowSearchModal(true)}
            onAddStory={handleAddStory}
            onOpenStory={openStory}
          />
        }
        renderItem={({ item }) => (
          <FeedPost
            post={item}
            onToggleLike={handleToggleLike}
            onOpenComments={(id) => setActiveCommentsPostId(id)}
          />
        )}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.neonBlue}
          />
        }
        ListEmptyComponent={
          !loadingFeed ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Sem posts ainda.</Text>
              <Text style={styles.emptySubText}>
                Adicione pessoas ao seu squad e veja os treinos delas aqui!
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loadingFeed && feed.length > 0 ? (
            <ActivityIndicator color={COLORS.neonBlue} style={styles.footerLoader} />
          ) : null
        }
      />

      <TouchableOpacity
        style={[styles.fab, { bottom: tabBarHeight + 16 }]}
        onPress={() => setShowNewPost(true)}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <UserSearchModal visible={showSearchModal} onClose={handleSearchClose} />

      <ConnectionRequestsModal
        visible={showRequests}
        requests={pendingRequests}
        onClose={() => setShowRequests(false)}
        onAccept={handleAcceptRequest}
        onDecline={handleDeclineRequest}
      />

      <CommentsSheet
        postId={activeCommentsPostId}
        visible={!!activeCommentsPostId}
        onClose={() => setActiveCommentsPostId(null)}
        onCommentsCountChange={handleCommentsCountChange}
      />

      <NewPostModal
        visible={showNewPost}
        onClose={() => setShowNewPost(false)}
        onPostCreated={handleNewPost}
      />

      <StoryViewer
        visible={storyViewerIndex !== null}
        groups={storyGroups}
        initialGroupIndex={storyViewerIndex ?? 0}
        onClose={() => setStoryViewerIndex(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingBottom: 100 },
  fab: {
    position: 'absolute',
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
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyText: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  emptySubText: { color: '#888', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  footerLoader: { marginVertical: 20 },
});
