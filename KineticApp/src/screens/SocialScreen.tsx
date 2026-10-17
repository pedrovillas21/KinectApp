import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import SquadBar from '../components/SquadBar';
import FeedPost from '../components/FeedPost';
import InviteDialog from '../components/InviteDialog';
import CommentsSheet from '../components/CommentsSheet';
import NewPostModal from '../components/NewPostModal';
import NewStoryModal from '../components/NewStoryModal';
import StoryViewer from '../components/StoryViewer';
import ArenaRanking from '../components/social/ArenaRanking';
import Icon, { IconName } from '../components/Icon';
import { Text, UnderlineTabs } from '../components/ui';
import { AuthContext } from '../contexts/AuthContext';
import useSquadStatus from '../hooks/useSquadStatus';
import api from '../services/api';
import {
  getFeed,
  getPendingRequests,
  getSquad,
  getStories,
  getUserPosts,
  likePost,
  unlikePost,
} from '../services/socialService';
import { FONT, KINETIC, RADIUS } from '../theme/kinetic';
import type { MainTabScreenProps } from '../navigation/types';
import type { FeedPostData, HomeDashboardResponseDTO, RankingEntryDTO, SquadMember, StoryGroup } from '../types';

type SocialTab = 'following' | 'arena' | 'mine';

const TABS: { key: SocialTab; label: string }[] = [
  { key: 'following', label: 'Seguindo' },
  { key: 'arena', label: 'Arena' },
  { key: 'mine', label: 'Você' },
];

function HeaderButton({ icon, label, onPress, badge }: { icon: IconName; label: string; onPress: () => void; badge?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.headerBtn}>
      <Icon name={icon} size={18} color={KINETIC.text} />
      {badge ? <View style={styles.badge} /> : null}
    </Pressable>
  );
}

export default function SocialScreen({ navigation }: MainTabScreenProps<'Social'>) {
  const { currentUser } = useContext(AuthContext);
  const myId = currentUser ? String(currentUser.id) : null;

  const [tab, setTab] = useState<SocialTab>('following');

  // Seguindo
  const [feed, setFeed] = useState<FeedPostData[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [squadMembers, setSquadMembers] = useState<SquadMember[]>([]);
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  // Arena e Você (carregam ao abrir a aba)
  const [ranking, setRanking] = useState<RankingEntryDTO[] | null>(null);
  const [myPosts, setMyPosts] = useState<FeedPostData[] | null>(null);

  // Sobreposições
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [showNewPost, setShowNewPost] = useState(false);
  const [showNewStory, setShowNewStory] = useState(false);
  const [storyViewerIndex, setStoryViewerIndex] = useState<number | null>(null);

  const liveSquad = useSquadStatus();
  const loadingFeedRef = useRef(false);

  // Prefer live polling data once available, seed from initial REST load
  useEffect(() => {
    if (liveSquad.length > 0) setSquadMembers(liveSquad);
  }, [liveSquad]);

  const loadFeedPage = useCallback(async (pageNum: number, reset = false) => {
    if (loadingFeedRef.current && !reset) return;
    loadingFeedRef.current = true;
    setLoadingFeed(true);
    try {
      const data = await getFeed(pageNum, 10);
      setFeed((prev) => (reset ? data.content : [...prev, ...data.content]));
      setPage(pageNum);
      setHasMore(!data.last);
    } catch {
      // mantém o que já estava na tela
    } finally {
      loadingFeedRef.current = false;
      setLoadingFeed(false);
    }
  }, []);

  const loadSquad = useCallback(() => getSquad().then(setSquadMembers).catch(() => {}), []);
  const loadStories = useCallback(() => getStories().then(setStoryGroups).catch(() => {}), []);
  const loadPending = useCallback(
    () => getPendingRequests().then((r) => setPendingCount(r.length)).catch(() => {}),
    [],
  );
  const loadRanking = useCallback(
    () =>
      api
        .get<HomeDashboardResponseDTO>('/home/dashboard')
        .then((res) => setRanking(res.data.ranking ?? []))
        .catch(() => setRanking([])),
    [],
  );
  const loadMyPosts = useCallback(() => {
    if (!myId) return Promise.resolve();
    return getUserPosts(myId, 0, 20)
      .then((p) => setMyPosts(p.content))
      .catch(() => setMyPosts([]));
  }, [myId]);

  useEffect(() => {
    loadFeedPage(0, true);
    loadSquad();
    loadStories();
    loadPending();
  }, [loadFeedPage, loadSquad, loadStories, loadPending]);

  useEffect(() => {
    if (tab === 'arena' && ranking === null) loadRanking();
    if (tab === 'mine' && myPosts === null) loadMyPosts();
  }, [tab, ranking, myPosts, loadRanking, loadMyPosts]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (tab === 'following') {
      await Promise.all([loadFeedPage(0, true), loadSquad(), loadStories(), loadPending()]);
    } else if (tab === 'arena') {
      await loadRanking();
    } else {
      await loadMyPosts();
    }
    setRefreshing(false);
  }, [tab, loadFeedPage, loadSquad, loadStories, loadPending, loadRanking, loadMyPosts]);

  const handleEndReached = useCallback(() => {
    if (!loadingFeedRef.current && hasMore) loadFeedPage(page + 1);
  }, [hasMore, page, loadFeedPage]);

  const handleToggleLike = (postId: string, liked: boolean): Promise<number> =>
    liked ? likePost(postId) : unlikePost(postId);

  const handleCommentsCountChange = (postId: string, count: number) => {
    const update = (list: FeedPostData[]) => list.map((p) => (p.id === postId ? { ...p, commentsCount: count } : p));
    setFeed(update);
    setMyPosts((prev) => (prev ? update(prev) : prev));
  };

  const handleNewPost = (post: FeedPostData) => {
    setFeed((prev) => [post, ...prev]);
    setMyPosts((prev) => (prev ? [post, ...prev] : prev));
  };

  const openProfile = useCallback(
    (userId: string) => {
      if (userId === myId) {
        navigation.navigate('Profile');
        return;
      }
      navigation.navigate('UserProfile', { userId });
    },
    [myId, navigation],
  );

  const openStory = (userId: string) => {
    const index = storyGroups.findIndex((g) => g.userId === userId);
    if (index >= 0) setStoryViewerIndex(index);
  };

  const handleInviteChanged = () => {
    loadSquad();
    loadPending();
    loadFeedPage(0, true);
    setRanking(null);
  };

  const refreshControl = (
    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={KINETIC.primary} />
  );

  const renderPost = ({ item }: { item: FeedPostData }) => (
    <FeedPost
      post={item}
      onToggleLike={handleToggleLike}
      onOpenComments={setActiveCommentsPostId}
      onPressAuthor={openProfile}
    />
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <View style={styles.header}>
        <Text variant="display" accessibilityRole="header">
          Comunidade
        </Text>
        <View style={styles.headerActions}>
          {/* Um botão só: a busca de pessoas fica dentro do balão de convite (aba Amigo). */}
          <HeaderButton
            icon="user-plus"
            label={
              pendingCount > 0
                ? `Buscar e convidar pessoas. ${pendingCount} pedidos recebidos`
                : 'Buscar e convidar pessoas'
            }
            onPress={() => setInviteOpen(true)}
            badge={pendingCount > 0}
          />
        </View>
      </View>

      <UnderlineTabs tabs={TABS} value={tab} onChange={setTab} />

      {tab === 'following' ? (
        <FlatList
          data={feed}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <SquadBar
              items={squadMembers}
              storyUserIds={storyGroups.map((g) => g.userId)}
              onAddStory={() => setShowNewStory(true)}
              onOpenStory={openStory}
              onMemberPress={(m) => openProfile(m.id)}
            />
          }
          renderItem={renderPost}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.4}
          refreshControl={refreshControl}
          ListEmptyComponent={
            !loadingFeed ? (
              <View style={styles.empty}>
                <Text variant="bodyStrong">Sem posts ainda</Text>
                <Text variant="body" color={KINETIC.textSecondary} style={styles.center}>
                  Adicione amigos e veja os treinos deles aqui.
                </Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            loadingFeed && feed.length > 0 ? <ActivityIndicator color={KINETIC.primary} style={styles.loader} /> : null
          }
        />
      ) : tab === 'arena' ? (
        <ScrollView contentContainerStyle={styles.listContent} refreshControl={refreshControl}>
          {ranking === null ? (
            <ActivityIndicator color={KINETIC.primary} style={styles.loader} />
          ) : (
            <ArenaRanking entries={ranking} onPressUser={openProfile} />
          )}
        </ScrollView>
      ) : (
        <FlatList
          data={myPosts ?? []}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={renderPost}
          refreshControl={refreshControl}
          ListEmptyComponent={
            myPosts === null ? (
              <ActivityIndicator color={KINETIC.primary} style={styles.loader} />
            ) : (
              <View style={styles.empty}>
                <Text variant="bodyStrong">Você ainda não publicou</Text>
                <Text variant="body" color={KINETIC.textSecondary} style={styles.center}>
                  Compartilhe um treino com seus amigos.
                </Text>
              </View>
            )
          }
        />
      )}

      {tab !== 'arena' ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Nova publicação"
          onPress={() => setShowNewPost(true)}
          style={({ pressed }) => [styles.publish, pressed && styles.pressed]}
        >
          <Icon name="plus" size={18} color={KINETIC.onPrimary} strokeWidth={2.2} />
          <Text style={styles.publishText} color={KINETIC.onPrimary}>
            Publicar
          </Text>
        </Pressable>
      ) : null}

      <InviteDialog
        visible={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onChanged={handleInviteChanged}
        onOpenProfile={openProfile}
      />

      <CommentsSheet
        postId={activeCommentsPostId}
        visible={!!activeCommentsPostId}
        onClose={() => setActiveCommentsPostId(null)}
        onCommentsCountChange={handleCommentsCountChange}
      />

      <NewPostModal visible={showNewPost} onClose={() => setShowNewPost(false)} onPostCreated={handleNewPost} />

      <NewStoryModal visible={showNewStory} onClose={() => setShowNewStory(false)} onStoryCreated={loadStories} />

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
  container: { flex: 1, backgroundColor: KINETIC.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 6,
  },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: KINETIC.ghost,
    backgroundColor: KINETIC.surface1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: KINETIC.primary,
  },
  listContent: { paddingBottom: 88 },
  empty: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 32, gap: 6 },
  center: { textAlign: 'center' },
  loader: { marginVertical: 24 },
  publish: {
    position: 'absolute',
    right: 20,
    bottom: 16,
    height: 48,
    paddingHorizontal: 18,
    borderRadius: 24,
    backgroundColor: KINETIC.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  publishText: { fontFamily: FONT.semibold, fontSize: 14, lineHeight: 18 },
  pressed: { opacity: 0.85 },
});
