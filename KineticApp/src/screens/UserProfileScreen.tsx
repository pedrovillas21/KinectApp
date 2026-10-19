import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, StyleSheet, View } from 'react-native';

import FeedPost from '../components/FeedPost';
import CommentsSheet from '../components/CommentsSheet';
import Icon from '../components/Icon';
import ProfileHeader from '../components/profile/ProfileHeader';
import WeeklyMinutesCard from '../components/profile/WeeklyMinutesCard';
import RecordsList from '../components/profile/RecordsList';
import AchievementBadges from '../components/profile/AchievementBadges';
import ProfileActivity from '../components/profile/ProfileActivity';
import { Button, Dialog, Screen, StackHeader, Text } from '../components/ui';
import usePaged from '../hooks/usePaged';
import { getPublicProfile, getUserWorkouts, httpStatus } from '../services/profileService';
import {
  acceptConnection,
  getUserPosts,
  likePost,
  removeConnection,
  sendConnection,
  unlikePost,
} from '../services/socialService';
import { KINETIC, RADIUS } from '../theme/kinetic';
import { formatMonthYear } from '../utils/formatters';
import type { MainStackScreenProps } from '../navigation/types';
import type { FeedPostData, PublicProfile, WorkoutSummary } from '../types';
import { showAlert } from '../components/ui/AlertHost';

export default function UserProfileScreen({ navigation, route }: MainStackScreenProps<'UserProfile'>) {
  const { userId } = route.params;

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [error, setError] = useState<'notfound' | 'failed' | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const posts = usePaged<FeedPostData>(useCallback((page) => getUserPosts(userId, page, 12), [userId]));
  const workouts = usePaged<WorkoutSummary>(useCallback((page) => getUserWorkouts(userId, page, 10), [userId]));
  const [openPost, setOpenPost] = useState<FeedPostData | null>(null);
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      const data = await getPublicProfile(userId);
      setProfile(data);
      setError(null);
      return data;
    } catch (e) {
      setError(httpStatus(e) === 404 ? 'notfound' : 'failed');
      return null;
    }
  }, [userId]);

  const { reload: reloadPosts, reset: resetPosts } = posts;
  const { reset: resetWorkouts } = workouts;
  const reloadAll = useCallback(async () => {
    const data = await loadProfile();
    resetPosts();
    resetWorkouts();
    if (data && !data.locked) reloadPosts();
  }, [loadProfile, reloadPosts, resetPosts, resetWorkouts]);

  useEffect(() => {
    reloadAll();
  }, [reloadAll]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await reloadAll();
    setRefreshing(false);
  };

  const runConnectionAction = async (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try {
      await action();
      await reloadAll();
    } catch {
      showAlert('Comunidade', 'Não foi possível concluir agora. Tente novamente.');
    } finally {
      setBusy(false);
    }
  };

  const confirmUnfriend = (name: string) =>
    showAlert('Desfazer amizade?', `Você deixa de ver os treinos e publicações de ${name}.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Desfazer', style: 'destructive', onPress: () => runConnectionAction(() => removeConnection(userId)) },
    ]);

  const header = (
    <StackHeader
      title={profile ? profile.name.split(' ')[0] : ''}
      onBack={() => navigation.goBack()}
    />
  );

  if (!profile) {
    return (
      <Screen scroll={false} edges={['top', 'bottom', 'left', 'right']} header={header} contentStyle={styles.center}>
        {error ? (
          <View style={styles.message}>
            <Text variant="bodyStrong">{error === 'notfound' ? 'Perfil não encontrado' : 'Não foi possível carregar'}</Text>
            {error === 'failed' ? <Button label="Tentar de novo" size="md" block={false} onPress={reloadAll} /> : null}
          </View>
        ) : (
          <ActivityIndicator color={KINETIC.primary} />
        )}
      </Screen>
    );
  }

  const firstName = profile.name.split(' ')[0];
  const state = profile.connectionState;
  const lines = profile.memberSince ? [`Membro desde ${formatMonthYear(profile.memberSince)}`] : [];

  const connectionButton = (() => {
    switch (state) {
      case 'CONNECTED':
        return <Button label="Amigos" icon="check" variant="ghost" size="md" block disabled={busy} onPress={() => confirmUnfriend(firstName)} />;
      case 'NONE':
        return <Button label="Adicionar" icon="user-plus" size="md" block loading={busy} onPress={() => runConnectionAction(() => sendConnection(userId))} />;
      case 'PENDING_OUTGOING':
        return <Button label="Pedido enviado" variant="secondary" size="md" block disabled />;
      case 'PENDING_INCOMING':
        return <Button label="Aceitar pedido" size="md" block loading={busy} onPress={() => runConnectionAction(() => acceptConnection(userId))} />;
      default:
        return null;
    }
  })();

  return (
    <Screen
      edges={['top', 'bottom', 'left', 'right']}
      header={header}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={KINETIC.primary} />}
    >
      <ProfileHeader
        name={profile.name}
        avatarUrl={profile.avatarUrl}
        seed={profile.id}
        lines={lines}
        counters={[
          { label: 'Treinos', value: profile.workoutsCount },
          { label: 'Amigos', value: profile.friendsCount },
          { label: 'Sequência atual', value: `${profile.streakDays} ${profile.streakDays === 1 ? 'dia' : 'dias'}` },
        ]}
      />

      {connectionButton ? (
        <View style={styles.actions}>
          <View style={styles.action}>{connectionButton}</View>
          {state === 'CONNECTED' ? (
            <View style={styles.action}>
              <Button
                label="Comparar progresso"
                size="md"
                block
                onPress={() => navigation.navigate('CompareProgress', { friendId: userId })}
              />
            </View>
          ) : null}
        </View>
      ) : null}

      {profile.locked ? (
        <View style={styles.locked}>
          <Icon name="lock" size={22} color={KINETIC.textSecondary} />
          <Text variant="bodyStrong">Perfil fechado</Text>
          <Text variant="body" color={KINETIC.textSecondary} style={styles.centerText}>
            Vocês precisam ser amigos para ver treinos, recordes e publicações de {firstName}.
          </Text>
        </View>
      ) : (
        <View style={styles.sections}>
          {profile.weeklyMinutes.length > 0 ? (
            <WeeklyMinutesCard weekStarts={profile.weekStarts} weeklyMinutes={profile.weeklyMinutes} />
          ) : null}
          <RecordsList records={profile.records} />
          <AchievementBadges achievements={profile.achievements} />

          <ProfileActivity
            posts={posts}
            workouts={workouts}
            postsCount={profile.postsCount}
            workoutsCount={profile.workoutsCount}
            onPressPost={setOpenPost}
            emptyPosts={`${firstName} ainda não publicou.`}
            emptyWorkouts={`${firstName} ainda não registrou treinos.`}
          />
        </View>
      )}

      <Dialog visible={!!openPost} onClose={() => setOpenPost(null)} title="Publicação">
        {openPost ? (
          <FeedPost
            bare
            post={openPost}
            onToggleLike={(id, liked) => (liked ? likePost(id) : unlikePost(id))}
            onOpenComments={(id) => {
              setOpenPost(null);
              setCommentsPostId(id);
            }}
          />
        ) : null}
      </Dialog>

      <CommentsSheet
        postId={commentsPostId}
        visible={!!commentsPostId}
        onClose={() => setCommentsPostId(null)}
        onCommentsCountChange={(id, count) =>
          posts.update((items) => items.map((x) => (x.id === id ? { ...x, commentsCount: count } : x)))
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  message: { alignItems: 'center', gap: 12 },
  actions: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingTop: 14 },
  action: { flex: 1 },
  locked: {
    marginTop: 20,
    marginHorizontal: 16,
    padding: 20,
    borderRadius: RADIUS.xl,
    backgroundColor: KINETIC.surface1,
    alignItems: 'center',
    gap: 8,
  },
  centerText: { textAlign: 'center' },
  sections: { marginTop: 20, gap: 22 },
});
