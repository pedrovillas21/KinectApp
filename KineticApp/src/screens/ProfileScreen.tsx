import React, { useCallback, useContext, useState } from 'react';
import { Pressable, RefreshControl, Share, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import NewPostModal from '../components/NewPostModal';
import InviteDialog from '../components/InviteDialog';
import Icon, { IconName } from '../components/Icon';
import ProfileHeader from '../components/profile/ProfileHeader';
import AvatarViewer from '../components/profile/AvatarViewer';
import useFocusResource from '../hooks/useFocusResource';
import ProfileActivity from '../components/profile/ProfileActivity';
import RecordsList from '../components/profile/RecordsList';
import { Avatar, Button, Dialog, Screen, StaleBanner, Text } from '../components/ui';
import { AuthContext } from '../contexts/AuthContext';
import { goalLabel, hasMedicalInfo, levelLabel } from '../constants/protocol';
import usePaged from '../hooks/usePaged';
import api from '../services/api';
import { getPublicProfile, getUserWorkouts } from '../services/profileService';
import { getUserPosts } from '../services/socialService';
import { getMyTrainer } from '../services/trainerService';
import { KINETIC, RADIUS } from '../theme/kinetic';
import { formatMonthYear } from '../utils/formatters';
import type { MainTabScreenProps } from '../navigation/types';
import type { FeedPostData, PublicProfile, TrainerPeer, UserProfileResponse, WorkoutSummary } from '../types';

function HeaderButton({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.headerBtn}>
      <Icon name={icon} size={18} color={KINETIC.text} />
    </Pressable>
  );
}

function Tile({ icon, label, sub, onPress }: { icon: IconName; label: string; sub: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${sub}`}
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
    >
      <Icon name={icon} size={20} color={KINETIC.primary} strokeWidth={1.7} />
      <View style={styles.tileTexts}>
        <Text variant="bodyStrong">{label}</Text>
        <Text variant="caption" color={KINETIC.textSecondary} numberOfLines={1}>
          {sub}
        </Text>
      </View>
    </Pressable>
  );
}

function CardRow({
  leading,
  title,
  subtitle,
  onPress,
}: {
  leading: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      onPress={onPress}
      style={({ pressed }) => [styles.cardRow, pressed && styles.pressed]}
    >
      {leading}
      <View style={styles.cardTexts}>
        <Text variant="bodyStrong">{title}</Text>
        <Text variant="caption" color={KINETIC.textSecondary} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <Icon name="chevron-right" size={16} color={KINETIC.textMuted} />
    </Pressable>
  );
}

/** Aba "Você": perfil próprio, atalhos, personal, protocolo e atividade. */
export default function ProfileScreen({ navigation }: MainTabScreenProps<'Profile'>) {
  const { currentUser } = useContext(AuthContext);
  const myId = currentUser ? String(currentUser.id) : '';

  const [refreshing, setRefreshing] = useState(false);
  const [recordsOpen, setRecordsOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [newPostOpen, setNewPostOpen] = useState(false);

  const posts = usePaged<FeedPostData>(useCallback((page) => getUserPosts(myId, page, 12), [myId]));
  const workouts = usePaged<WorkoutSummary>(useCallback((page) => getUserWorkouts(myId, page, 10), [myId]));
  const { reload: reloadPosts } = posts;
  const { reset: resetWorkouts } = workouts;

  const profileRes = useFocusResource(myId ? `profile/${myId}` : null, () => getPublicProfile(myId));
  const accountRes = useFocusResource('users/profile', () =>
    api.get<UserProfileResponse>('/users/profile').then((r) => r.data),
  );
  // Só o par do vínculo ATIVO; o vínculo inteiro fica em 'me/trainer' (Protocolo/Anamnese).
  const trainerRes = useFocusResource('me/trainer-peer', () =>
    getMyTrainer().then((link) => (link?.status === 'ATIVO' ? link.peer : null)),
  );
  const profile: PublicProfile | null = profileRes.data ?? null;
  const account: UserProfileResponse | null = accountRes.data ?? null;
  const trainer: TrainerPeer | null = trainerRes.data ?? null;

  // Listas paginadas não entram no cache: recarregam a cada foco.
  useFocusEffect(
    useCallback(() => {
      if (!myId) return;
      resetWorkouts();
      reloadPosts();
    }, [myId, resetWorkouts, reloadPosts]),
  );

  const loadAll = useCallback(async () => {
    await Promise.all([profileRes.refresh(), accountRes.refresh(), trainerRes.refresh()]);
    resetWorkouts();
    reloadPosts();
  }, [profileRes.refresh, accountRes.refresh, trainerRes.refresh, resetWorkouts, reloadPosts]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  const name = profile?.name ?? account?.fullName ?? currentUser?.nome ?? '';

  const shareProfile = () => {
    Share.share({ message: `Treino com o Kinetic. Me adicione lá: ${name}` }).catch(() => {});
  };

  const protocolSummary = account
    ? [
        account.targetGoal ? goalLabel(account.targetGoal) : null,
        account.level ? levelLabel(account.level).toLowerCase() : null,
        account.frequency ? `${account.frequency}x/sem` : null,
        hasMedicalInfo(account.medicalConditions) ? 'anamnese completa' : 'anamnese pendente',
      ]
        .filter(Boolean)
        .join(' · ')
    : 'Objetivo, medidas, nível e anamnese';

  const measures =
    account && (account.weight || account.height)
      ? [account.weight ? `Peso ${account.weight} kg` : null, account.height ? `${account.height} cm` : null]
          .filter(Boolean)
          .join(' · ')
      : 'Peso e altura';

  return (
    <Screen
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={KINETIC.primary} />}
      header={
        <View style={styles.header}>
          <Text variant="display" accessibilityRole="header" style={styles.flex}>
            Você
          </Text>
          <HeaderButton icon="share" label="Compartilhar perfil" onPress={shareProfile} />
          <HeaderButton icon="settings" label="Configurações" onPress={() => navigation.navigate('Settings')} />
        </View>
      }
    >
      <StaleBanner visible={profileRes.error || accountRes.error} onRetry={loadAll} hasData={!!profile} />
      <ProfileHeader
        name={name}
        avatarUrl={profile?.avatarUrl}
        seed={myId}
        onAvatarPress={() => setAvatarOpen(true)}
        lines={profile?.memberSince ? [`Membro desde ${formatMonthYear(profile.memberSince)}`] : []}
        counters={[
          { label: 'Treinos', value: profile?.workoutsCount ?? '—' },
          { label: 'Amigos', value: profile?.friendsCount ?? '—' },
          {
            label: 'Sequência atual',
            value: profile ? `${profile.streakDays} ${profile.streakDays === 1 ? 'dia' : 'dias'}` : '—',
          },
        ]}
      />

      <View style={styles.buttons}>
        <Button label="Editar perfil" variant="ghost" size="md" block onPress={() => navigation.navigate('Settings')} style={styles.flex} />
        <Button label="Compartilhar perfil" variant="ghost" size="md" block onPress={shareProfile} style={styles.flex} />
      </View>

      <View style={styles.tiles}>
        <Tile icon="progress" label="Estatísticas" sub="Volume, frequência, séries" onPress={() => navigation.navigate('Stats')} />
        <Tile
          icon="trophy"
          label="Recordes"
          sub={profile ? `${profile.records.length} exercícios` : 'Seus melhores levantamentos'}
          onPress={() => setRecordsOpen(true)}
        />
        <Tile icon="ruler" label="Medidas" sub={measures} onPress={() => navigation.navigate('Protocol')} />
        <Tile icon="dumbbell" label="Fichas" sub="Seus treinos" onPress={() => navigation.navigate('Train')} />
      </View>

      <View style={styles.card}>
        {trainer ? (
          <CardRow
            leading={<Avatar name={trainer.nome} uri={trainer.avatarUrl} seed={trainer.id} size={36} />}
            title="Seu personal"
            subtitle={trainer.nome}
            onPress={() => navigation.navigate('TrainerProfile')}
          />
        ) : (
          <CardRow
            leading={
              <View style={styles.cardIcon}>
                <Icon name="user-plus" size={18} color={KINETIC.primary} />
              </View>
            }
            title="Adicionar personal"
            subtitle="Use o código ou aceite um convite"
            onPress={() => setInviteOpen(true)}
          />
        )}
        <View style={styles.cardDivider} />
        <CardRow
          leading={
            <View style={styles.cardIcon}>
              <Icon name="target" size={18} color={KINETIC.primary} />
            </View>
          }
          title="Meu protocolo"
          subtitle={protocolSummary}
          onPress={() => navigation.navigate('Protocol')}
        />
      </View>

      <View style={styles.activity}>
        <ProfileActivity
          posts={posts}
          workouts={workouts}
          postsCount={profile?.postsCount ?? posts.items.length}
          workoutsCount={profile?.monthWorkoutsCount ?? 0}
          onPressPost={(post) =>
            navigation.navigate('ProfilePosts', {
              userId: myId,
              startId: post.id,
              items: posts.items,
              page: posts.page,
              last: posts.last,
            })
          }
          onCreatePost={() => setNewPostOpen(true)}
          achievements={profile?.achievements ?? []}
          emptyPosts="Você ainda não publicou."
          emptyWorkouts="Você ainda não registrou treinos este mês."
        />
      </View>

      <Dialog visible={recordsOpen} onClose={() => setRecordsOpen(false)} title="Seus recordes">
        {profile && profile.records.length > 0 ? (
          <RecordsList records={profile.records} bare />
        ) : (
          <Text variant="body" color={KINETIC.textSecondary}>
            Seus recordes aparecem aqui depois dos primeiros treinos registrados.
          </Text>
        )}
      </Dialog>


      <NewPostModal
        visible={newPostOpen}
        onClose={() => setNewPostOpen(false)}
        onPostCreated={(post) => posts.update((items) => [post, ...items])}
      />

      <InviteDialog visible={inviteOpen} onClose={() => setInviteOpen(false)} initialTab="trainer" onChanged={loadAll} />
      <AvatarViewer
        visible={avatarOpen}
        onClose={() => setAvatarOpen(false)}
        name={name}
        seed={myId}
        uri={profile?.avatarUrl}
        editable
        // Mesma chave de cache da Comunidade e de Configurações: as três telas pegam a foto nova.
        onChanged={() => profileRes.refresh()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 20, paddingRight: 16, paddingTop: 16, paddingBottom: 6 },
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
  buttons: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingTop: 14 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 20, marginHorizontal: 16 },
  tile: {
    width: '48.5%',
    flexGrow: 1,
    padding: 14,
    borderRadius: 14,
    backgroundColor: KINETIC.surface1,
    gap: 10,
  },
  tileTexts: { gap: 2 },
  pressed: { opacity: 0.85 },
  card: { marginTop: 8, marginHorizontal: 16, borderRadius: 14, backgroundColor: KINETIC.surface1, overflow: 'hidden' },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, minHeight: 60 },
  cardTexts: { flex: 1, minWidth: 0, gap: 2 },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: KINETIC.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginLeft: 62 },
  activity: { marginTop: 22 },
});
