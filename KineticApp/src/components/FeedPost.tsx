import React, { useState } from 'react';
import { Image, Pressable, Share, StyleSheet, View } from 'react-native';
import { KINETIC, RADIUS } from '../theme/kinetic';
import type { FeedPostData } from '../types';
import { formatBestSet, formatDurationSeconds, formatThousands } from '../utils/formatters';
import { formatPostTime } from '../utils/dateRelative';
import Icon from './Icon';
import WorkoutPhotoStrip from './WorkoutPhotoStrip';
import { Avatar, StatRow, StatTile, Text } from './ui';

interface Props {
  post: FeedPostData;
  onToggleLike?: (postId: string, liked: boolean) => Promise<number>;
  onOpenComments?: (postId: string) => void;
  /** Toque no autor (avatar/nome) → perfil dele. */
  onPressAuthor?: (userId: string) => void;
  /** Sem margem lateral nem divisória (post aberto dentro de um balão). */
}

/** Post do feed no estilo do redesign: autor, treino resumido, foto, exercícios e ações. */
export default function FeedPost({ post, onToggleLike, onOpenComments, onPressAuthor }: Props) {
  const [isLiked, setIsLiked] = useState(post.isLikedByMe);
  const [likesCount, setLikesCount] = useState(post.likesCount);

  const handleLike = async () => {
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikesCount((prev) => (nextLiked ? prev + 1 : prev - 1));

    if (onToggleLike) {
      try {
        const serverCount = await onToggleLike(post.id, nextLiked);
        setLikesCount(serverCount);
      } catch {
        setIsLiked(!nextLiked);
        setLikesCount((prev) => (nextLiked ? prev - 1 : prev + 1));
      }
    }
  };

  const handleShare = () => {
    const title = post.title ?? post.category;
    const message = [`${post.author.nome} no Kinetic`, title, post.caption].filter(Boolean).join('\n');
    Share.share({ message }).catch(() => {});
  };

  const title = post.title ?? (post.category || null);
  // Post antigo sem treino ligado ainda pode trazer a duração como texto ("58 min").
  const duration = post.durationSeconds ? formatDurationSeconds(post.durationSeconds) : post.duration || null;
  const hasVolume = post.volumeKg != null && post.volumeKg > 0;
  const records = post.recordsCount ?? 0;
  // Foto de treino ligado: tonelagem/tempo/treino vão na faixa sobre a imagem, não na linha de números.
  const photoStrip = !!post.imageUrl && !!post.title && hasVolume && !!post.durationSeconds;
  const showStats = !photoStrip && (!!duration || hasVolume || records > 0);
  const exercises = post.exercises ?? [];
  const more = post.moreExercises ?? 0;

  return (
    <View style={styles.post}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Ver perfil de ${post.author.nome}`}
          onPress={() => onPressAuthor?.(post.author.id)}
          style={styles.author}
        >
          <Avatar name={post.author.nome} uri={post.author.avatarUrl || null} seed={post.author.id} size={40} />
          <View style={styles.authorTexts}>
            <Text variant="bodyStrong" numberOfLines={1}>
              {post.author.nome}
            </Text>
            <Text variant="caption" color={KINETIC.textSecondary} numberOfLines={1}>
              {formatPostTime(post.createdAt) ?? post.timestamp}
            </Text>
          </View>
        </Pressable>
      </View>

      {title ? (
        <Text variant="headline" style={styles.title}>
          {title}
        </Text>
      ) : null}
      {post.caption ? (
        <Text variant="body" color={KINETIC.textDim} style={styles.caption}>
          {post.caption}
        </Text>
      ) : null}

      {showStats ? (
        <StatRow card={false} style={styles.stats}>
          <StatTile size="sm" label="Duração" value={duration ?? '—'} />
          <StatTile size="sm" label="Volume" value={hasVolume ? `${formatThousands(post.volumeKg!)} kg` : '—'} />
          <StatTile size="sm" label="Recordes" value={records} color={records > 0 ? KINETIC.record : KINETIC.text} />
        </StatRow>
      ) : null}

      {post.imageUrl ? (
        <View style={styles.image}>
          <Image
            source={{ uri: post.imageUrl }}
            style={StyleSheet.absoluteFill}
            accessibilityLabel={title ? `Foto do treino ${title}` : 'Foto do post'}
          />
          {photoStrip ? (
            <WorkoutPhotoStrip volumeKg={post.volumeKg!} durationSeconds={post.durationSeconds!} title={post.title!} />
          ) : null}
        </View>
      ) : null}

      {exercises.length > 0 ? (
        <View style={styles.exercises}>
          {exercises.map((ex, i) => (
            <View key={`${ex.name}-${i}`} style={styles.exercise}>
              <View style={styles.exerciseIcon}>
                <Icon name="dumbbell" size={16} color={KINETIC.textSecondary} />
              </View>
              <Text variant="body" numberOfLines={1} style={styles.exerciseName}>
                <Text variant="monoBody" color={KINETIC.textDim}>
                  {ex.setsCount}×{' '}
                </Text>
                {ex.name}
              </Text>
              <Text variant="mono" color={KINETIC.textDim}>
                {formatBestSet(ex.bestSet)}
              </Text>
            </View>
          ))}
          {more > 0 ? (
            <Text variant="body" color={KINETIC.textSecondary} style={styles.more}>
              + {more} {more === 1 ? 'exercício' : 'exercícios'}
            </Text>
          ) : null}
        </View>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isLiked ? 'Descurtir' : 'Curtir'}
          accessibilityState={{ selected: isLiked }}
          onPress={handleLike}
          style={styles.action}
        >
          <Icon name={isLiked ? 'heart-filled' : 'heart'} size={19} color={isLiked ? KINETIC.primary : KINETIC.text} />
          <Text variant="body">{likesCount}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Comentários, ${post.commentsCount}`}
          onPress={() => onOpenComments?.(post.id)}
          style={styles.action}
        >
          <Icon name="comment" size={19} color={KINETIC.text} />
          <Text variant="body">{post.commentsCount}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Compartilhar" onPress={handleShare} style={styles.share}>
          <Icon name="share" size={18} color={KINETIC.text} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  post: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: KINETIC.hairline,
  },
  header: { flexDirection: 'row', alignItems: 'center' },
  author: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 },
  authorTexts: { flex: 1, minWidth: 0, gap: 2 },
  title: { marginTop: 12 },
  caption: { marginTop: 4 },
  stats: { marginTop: 12 },
  image: {
    marginTop: 14,
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: KINETIC.media,
  },
  exercises: { marginTop: 8 },
  exercise: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 44 },
  exerciseIcon: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: KINETIC.surface1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseName: { flex: 1 },
  more: { paddingVertical: 2 },
  actions: { flexDirection: 'row', alignItems: 'center', marginTop: 6, marginHorizontal: -8, paddingBottom: 6 },
  action: { minHeight: 44, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  share: { marginLeft: 'auto', width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
