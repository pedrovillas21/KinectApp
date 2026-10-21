import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import FeedPost from '../components/FeedPost';
import CommentsSheet from '../components/CommentsSheet';
import { Screen, StackHeader } from '../components/ui';
import usePaged from '../hooks/usePaged';
import { getUserPosts, likePost, unlikePost } from '../services/socialService';
import { KINETIC } from '../theme/kinetic';
import type { MainStackScreenProps } from '../navigation/types';
import type { FeedPostData } from '../types';

/**
 * Publicações de um perfil em lista, estilo Instagram: abre no post tocado na grade e
 * rola entre todos (para cima até o mais novo, para baixo até o mais antigo). Tela da
 * pilha, então a seta, o voltar do Android e o deslize lateral do iOS saem dela.
 */
export default function ProfilePostsScreen({ navigation, route }: MainStackScreenProps<'ProfilePosts'>) {
  const { userId, startId, items, page, last } = route.params;
  const posts = usePaged<FeedPostData>(
    useCallback((p) => getUserPosts(userId, p, 12), [userId]),
    { items, page, last },
  );
  const listRef = useRef<FlatList<FeedPostData>>(null);
  const positioned = useRef(false);
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  const startIndex = Math.max(0, items.findIndex((p) => p.id === startId));

  const toggleLike = async (id: string, liked: boolean) => {
    const count = await (liked ? likePost(id) : unlikePost(id));
    posts.update((list) => list.map((p) => (p.id === id ? { ...p, isLikedByMe: liked, likesCount: count } : p)));
    return count;
  };

  return (
    <Screen
      scroll={false}
      edges={['top', 'bottom', 'left', 'right']}
      header={<StackHeader title="Publicações" onBack={() => navigation.goBack()} />}
    >
      <FlatList
        ref={listRef}
        data={posts.items}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <FeedPost post={item} onToggleLike={toggleLike} onOpenComments={setCommentsPostId} />}
        // Altura dos posts varia (sem getItemLayout): posiciona no post tocado depois de medir.
        onLayout={() => {
          if (positioned.current) return;
          positioned.current = true;
          if (startIndex > 0) listRef.current?.scrollToIndex({ index: startIndex, animated: false });
        }}
        onScrollToIndexFailed={({ index, averageItemLength }) => {
          listRef.current?.scrollToOffset({ offset: index * averageItemLength, animated: false });
          setTimeout(() => listRef.current?.scrollToIndex({ index, animated: false }), 60);
        }}
        initialNumToRender={Math.min(items.length, startIndex + 3)}
        onEndReached={() => {
          if (!posts.last) posts.loadMore();
        }}
        onEndReachedThreshold={0.6}
        ListFooterComponent={
          posts.loading ? <ActivityIndicator color={KINETIC.primary} style={styles.loader} /> : <View style={styles.end} />
        }
        showsVerticalScrollIndicator={false}
      />

      <CommentsSheet
        postId={commentsPostId}
        visible={!!commentsPostId}
        onClose={() => setCommentsPostId(null)}
        onCommentsCountChange={(id, count) =>
          posts.update((list) => list.map((p) => (p.id === id ? { ...p, commentsCount: count } : p)))
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { marginVertical: 24 },
  end: { height: 24 },
});
