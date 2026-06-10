import React, { useEffect, useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  ListRenderItem,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { KINETIC } from '../theme/kinetic';
import { COLORS } from '../theme/colors';
import { getComments, addComment, avatarFallback } from '../services/socialService';
import type { Comment } from '../types';

interface Props {
  postId: string | null;
  visible: boolean;
  onClose: () => void;
  onCommentsCountChange?: (postId: string, count: number) => void;
}

export default function CommentsSheet({ postId, visible, onClose, onCommentsCountChange }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!postId || !visible) return;
    setLoading(true);
    getComments(postId)
      .then(setComments)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [postId, visible]);

  const handleSend = async () => {
    if (!postId || !body.trim() || sending) return;
    setSending(true);
    try {
      const comment = await addComment(postId, body.trim());
      setComments((prev) => [...prev, comment]);
      setBody('');
      onCommentsCountChange?.(postId, comments.length + 1);
    } catch {
      // silent
    } finally {
      setSending(false);
    }
  };

  const renderItem: ListRenderItem<Comment> = ({ item }) => (
    <View style={styles.commentRow}>
      <Image
        source={{ uri: avatarFallback(item.authorId, item.authorAvatarUrl) }}
        style={styles.avatar}
      />
      <View style={styles.commentBody}>
        <Text style={styles.commentAuthor}>{item.authorName}</Text>
        <Text style={styles.commentText}>{item.body}</Text>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <BlurView intensity={20} tint="dark" style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.handle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Comentários</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color={COLORS.neonBlue} style={styles.loader} />
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <Text style={styles.empty}>Sem comentários ainda. Seja o primeiro!</Text>
              }
            />
          )}

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Escrever comentário..."
              placeholderTextColor={KINETIC.textMuted}
              value={body}
              onChangeText={setBody}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!body.trim() || sending) && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!body.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <Text style={styles.sendBtnText}>➤</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  container: {
    backgroundColor: KINETIC.surface1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
    paddingBottom: 16,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: KINETIC.surface3,
    marginTop: 12,
    marginBottom: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: KINETIC.surface2,
  },
  sheetTitle: { color: KINETIC.text, fontSize: 18, fontWeight: 'bold' },
  closeBtn: { color: KINETIC.textMuted, fontSize: 20 },
  loader: { marginVertical: 24 },
  listContent: { padding: 16, gap: 16 },
  commentRow: { flexDirection: 'row', gap: 12 },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  commentBody: { flex: 1 },
  commentAuthor: { color: KINETIC.text, fontWeight: 'bold', fontSize: 13, marginBottom: 2 },
  commentText: { color: KINETIC.textDim, fontSize: 13, lineHeight: 18 },
  empty: { color: KINETIC.textMuted, textAlign: 'center', marginTop: 32 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: KINETIC.surface2,
  },
  input: {
    flex: 1,
    backgroundColor: KINETIC.surface2,
    color: KINETIC.text,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.neonBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
});
