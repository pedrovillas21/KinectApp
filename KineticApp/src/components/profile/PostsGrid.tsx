import React, { useState } from 'react';
import { Image, Pressable, View } from 'react-native';

import type { FeedPostData } from '../../types';
import { formatPostTime } from '../../utils/dateRelative';
import { formatThousands } from '../../utils/formatters';
import Icon from '../Icon';
import { Text } from '../ui';
import { createStyles, useColors } from '../../theme/ThemeContext';

interface PostsGridProps {
  posts: FeedPostData[];
  onPressPost: (post: FeedPostData) => void;
  /** Primeira célula "Publicar" (perfil próprio). */
  onCreate?: () => void;
}

const GAP = 2;

/** Grade 3 colunas: foto do post, ou um cartão com o treino quando não há foto. */
export default function PostsGrid({ posts, onPressPost, onCreate }: PostsGridProps) {
  const styles = useStyles();
  const c = useColors();
  const [width, setWidth] = useState(0);
  // floor: a soma de 3 células fracionadas + gaps passaria da largura e quebraria em 2 colunas.
  const size = width > 0 ? Math.floor((width - GAP * 2) / 3) : 0;
  return (
    <View style={styles.grid} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {onCreate ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Nova publicação"
          onPress={onCreate}
          style={[styles.create, { width: size, height: size }]}
        >
          <Icon name="plus" size={22} color={c.primary} strokeWidth={1.9} />
          <Text variant="captionStrong" color={c.primary}>
            Publicar
          </Text>
        </Pressable>
      ) : null}
      {posts.map((post) => {
        const title = post.title ?? (post.category || 'Publicação');
        return (
          <Pressable
            key={post.id}
            accessibilityRole="button"
            accessibilityLabel={`Abrir publicação ${title}`}
            onPress={() => onPressPost(post)}
            style={{ width: size, height: size }}
          >
            {post.imageUrl ? (
              <Image source={{ uri: post.imageUrl }} style={styles.image} />
            ) : (
              <View style={styles.card}>
                <Text variant="micro" color={c.primary} numberOfLines={2}>
                  {title}
                </Text>
                <View>
                  {post.volumeKg ? (
                    <Text variant="statSmall" numberOfLines={1}>
                      {formatThousands(post.volumeKg)} kg
                    </Text>
                  ) : null}
                  <Text variant="micro" color={c.textSecondary} numberOfLines={1}>
                    {formatPostTime(post.createdAt) ?? post.timestamp}
                  </Text>
                </View>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = createStyles((c) => ({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP, paddingTop: GAP },
  image: { width: '100%', height: '100%', backgroundColor: c.media },
  create: { backgroundColor: c.surface1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  card: { flex: 1, backgroundColor: c.surface1, padding: 10, justifyContent: 'space-between' },
}));
