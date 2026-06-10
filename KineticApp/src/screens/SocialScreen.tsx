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
import { ThemeContext } from '../contexts/ThemeContext';
import { COLORS } from '../theme/colors';
import AppHeader from '../components/AppHeader';
import SquadBar from '../components/SquadBar';
import FeedPost from '../components/FeedPost';
import UserSearchModal from '../components/UserSearchModal';
import CommentsSheet from '../components/CommentsSheet';
import NewPostModal from '../components/NewPostModal';
import useSquadStatus from '../hooks/useSquadStatus';
import {
  getFeed,
  likePost,
  unlikePost,
  getSquad,
} from '../services/socialService';
import type { FeedPostData, SquadMember } from '../types';

export default function SocialScreen() {
  const { isDarkMode } = useContext(ThemeContext);

  const [feed, setFeed] = useState<FeedPostData[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showNewPost, setShowNewPost] = useState(false);
  const [squadMembers, setSquadMembers] = useState<SquadMember[]>([]);

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

  useEffect(() => {
    loadFeedPage(0, true);
    loadSquad();
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadFeedPage(0, true), loadSquad()]);
    setRefreshing(false);
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

  const handleSearchClose = () => {
    setShowSearchModal(false);
    loadSquad();
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? COLORS.darkBackground : COLORS.lightBackground },
      ]}
    >
      <AppHeader />

      <FlatList
        data={feed}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <SquadBar
            items={squadMembers}
            onAddPress={() => setShowSearchModal(true)}
            onFindPress={() => setShowSearchModal(true)}
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

      <TouchableOpacity style={styles.fab} onPress={() => setShowNewPost(true)}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <UserSearchModal visible={showSearchModal} onClose={handleSearchClose} />

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingBottom: 100 },
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
