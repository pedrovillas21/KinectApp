import React, { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, ListRenderItem, Pressable, StyleSheet, View } from 'react-native';
import { TextInput } from './ui/scaled';
import { FONT, KINETIC, RADIUS } from '../theme/kinetic';
import Icon from './Icon';
import { Avatar, BottomSheet, Button, Text } from './ui';
import { showAlert } from './ui/AlertHost';
import { AuthContext } from '../contexts/AuthContext';
import { getComments, addComment } from '../services/socialService';
import { formatPostTime } from '../utils/dateRelative';
import type { Comment } from '../types';

interface Props {
  postId: string | null;
  visible: boolean;
  onClose: () => void;
  onCommentsCountChange?: (postId: string, count: number) => void;
}

export default function CommentsSheet({ postId, visible, onClose, onCommentsCountChange }: Props) {
  const { currentUser } = useContext(AuthContext);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const load = () => {
    if (!postId) return;
    setLoading(true);
    setLoadError(false);
    getComments(postId)
      .then(setComments)
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (visible) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, visible]);

  const canSend = !!body.trim() && !sending;

  const handleSend = async () => {
    if (!postId || !canSend) return;
    setSending(true);
    try {
      const comment = await addComment(postId, body.trim());
      setComments((prev) => [...prev, comment]);
      setBody('');
      onCommentsCountChange?.(postId, comments.length + 1);
    } catch {
      // O texto fica no campo para tentar de novo.
      showAlert('Não foi possível comentar', 'Verifique sua conexão e tente novamente.');
    } finally {
      setSending(false);
    }
  };

  const renderItem: ListRenderItem<Comment> = ({ item }) => (
    <View style={styles.comment}>
      <Avatar name={item.authorName} uri={item.authorAvatarUrl} seed={item.authorId} size={36} />
      <View style={styles.commentBody}>
        <View style={styles.commentMeta}>
          <Text variant="captionStrong" numberOfLines={1} style={styles.author}>
            {item.authorName}
          </Text>
          <Text variant="caption" color={KINETIC.textSecondary}>
            {formatPostTime(item.createdAt)}
          </Text>
        </View>
        <Text variant="body" color={KINETIC.textDim}>
          {item.body}
        </Text>
      </View>
    </View>
  );

  const content = loading ? (
    <ActivityIndicator color={KINETIC.primary} style={styles.state} />
  ) : loadError ? (
    <View style={styles.state}>
      <Text variant="bodyStrong">Não foi possível carregar os comentários</Text>
      <Button label="Tentar novamente" variant="secondary" size="sm" block={false} onPress={load} />
    </View>
  ) : (
    <FlatList
      data={comments}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        <View style={styles.state}>
          <View style={styles.emptyIcon}>
            <Icon name="comment" size={20} color={KINETIC.primary} />
          </View>
          <Text variant="bodyStrong">Nenhum comentário ainda</Text>
          <Text variant="caption" color={KINETIC.textSecondary}>
            Seja o primeiro a comentar.
          </Text>
        </View>
      }
    />
  );

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Comentários" scroll={false}>
      <View style={styles.flex}>{content}</View>

      <View style={styles.composer}>
        <Avatar name={currentUser?.nome} seed={currentUser?.id} size={32} />
        <TextInput
          style={styles.input}
          placeholder="Escreva um comentário..."
          placeholderTextColor={KINETIC.placeholder}
          accessibilityLabel="Comentário"
          value={body}
          onChangeText={setBody}
          maxLength={2000}
          multiline
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Enviar comentário"
          accessibilityState={{ disabled: !canSend, busy: sending }}
          onPress={handleSend}
          disabled={!canSend}
          style={({ pressed }) => [styles.send, canSend && styles.sendOn, pressed && styles.pressed]}
        >
          {sending ? (
            <ActivityIndicator color={KINETIC.onPrimary} size="small" />
          ) : (
            <Icon name="send" size={18} color={canSend ? KINETIC.onPrimary : KINETIC.textMuted} />
          )}
        </Pressable>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 4, paddingBottom: 16, gap: 18 },
  comment: { flexDirection: 'row', gap: 12 },
  commentBody: { flex: 1, gap: 2 },
  commentMeta: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  author: { flexShrink: 1 },
  state: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 40 },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginBottom: 6,
    backgroundColor: KINETIC.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: KINETIC.hairline,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderRadius: RADIUS.dialog,
    backgroundColor: KINETIC.surface1,
    fontFamily: FONT.regular,
    fontSize: 15,
    lineHeight: 20,
    color: KINETIC.text,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: KINETIC.surface1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendOn: { backgroundColor: KINETIC.primary },
  pressed: { opacity: 0.85 },
});
