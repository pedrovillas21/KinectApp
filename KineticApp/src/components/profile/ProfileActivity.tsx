import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import type { PagedList } from '../../hooks/usePaged';
import { KINETIC } from '../../theme/kinetic';
import type { Achievement, FeedPostData, WorkoutSummary } from '../../types';
import { Button, Text, UnderlineTabs } from '../ui';
import AchievementBadges from './AchievementBadges';
import PostsGrid from './PostsGrid';
import WorkoutSummaryCard from './WorkoutSummaryCard';

type ActivityTab = 'posts' | 'workouts' | 'achievements';

interface ProfileActivityProps {
  posts: PagedList<FeedPostData>;
  workouts: PagedList<WorkoutSummary>;
  postsCount: number;
  workoutsCount: number;
  onPressPost: (post: FeedPostData) => void;
  /** Texto dos vazios: "Ana ainda não publicou." / "Você ainda não publicou." */
  emptyPosts: string;
  emptyWorkouts: string;
  /** Primeira célula "Publicar" na grade (perfil próprio). */
  onCreatePost?: () => void;
  /** Mostra a aba Conquistas (perfil próprio). */
  achievements?: Achievement[];
}

/** Abas Publicações / Treinos (/ Conquistas) com paginação "Carregar mais". */
export default function ProfileActivity({
  posts,
  workouts,
  postsCount,
  workoutsCount,
  onPressPost,
  emptyPosts,
  emptyWorkouts,
  onCreatePost,
  achievements,
}: ProfileActivityProps) {
  const [tab, setTab] = useState<ActivityTab>('posts');

  // Posts carregam com a tela; treinos só quando a aba abre.
  useEffect(() => {
    if (tab === 'workouts' && workouts.page < 0 && !workouts.loading) workouts.reload();
  }, [tab, workouts]);

  const tabs: { key: ActivityTab; label: string }[] = [
    { key: 'posts', label: `Publicações ${postsCount}` },
    { key: 'workouts', label: `Treinos ${workoutsCount}` },
  ];
  if (achievements) tabs.push({ key: 'achievements', label: 'Conquistas' });

  const list = tab === 'workouts' ? workouts : posts;

  return (
    <View>
      <UnderlineTabs tabs={tabs} value={tab} onChange={setTab} />

      {tab === 'achievements' && achievements ? (
        <View style={styles.achievements}>
          <AchievementBadges achievements={achievements} initiallyExpanded />
        </View>
      ) : (
        <>
          {tab === 'posts' && (posts.items.length > 0 || onCreatePost) ? (
            <PostsGrid posts={posts.items} onPressPost={onPressPost} onCreate={onCreatePost} />
          ) : null}
          {tab === 'workouts' && workouts.items.length > 0 ? (
            <View style={styles.workouts}>
              {workouts.items.map((w) => (
                <WorkoutSummaryCard key={w.id} workout={w} />
              ))}
            </View>
          ) : null}

          {list.loading ? (
            <ActivityIndicator color={KINETIC.primary} style={styles.loader} />
          ) : list.items.length === 0 && list.page >= 0 ? (
            <Text variant="body" color={KINETIC.textSecondary} style={styles.empty}>
              {tab === 'posts' ? emptyPosts : emptyWorkouts}
            </Text>
          ) : !list.last && list.page >= 0 ? (
            <View style={styles.more}>
              <Button label="Carregar mais" variant="secondary" size="md" block onPress={list.loadMore} />
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  achievements: { paddingTop: 14 },
  workouts: { paddingTop: 12, gap: 10 },
  loader: { marginVertical: 20 },
  empty: { textAlign: 'center', paddingVertical: 24, paddingHorizontal: 32 },
  more: { paddingHorizontal: 20, paddingTop: 12 },
});
