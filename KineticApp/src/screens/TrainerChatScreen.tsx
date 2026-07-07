import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  ListRenderItem,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KINETIC } from '../theme/kinetic';
import Icon from '../components/Icon';
import { AuthContext } from '../contexts/AuthContext';
import { avatarFallback } from '../services/socialService';
import {
  ChatSocket,
  connectChatSocket,
  getMessages,
  markConversationRead,
  sendMessageRest,
} from '../services/chatService';
import type { ChatMessage } from '../types';

interface RouteParams {
  peerId: string;
  peerName: string;
  peerAvatarUrl?: string | null;
}

const PAGE_SIZE = 30;
// Sem WebSocket (rede restritiva, TextEncoder ausente…) o histórico é
// re-sincronizado por polling — chat continua funcional, só menos imediato.
const POLL_INTERVAL_MS = 10000;

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Conversa personal↔aluno (Fase 2): STOMP em tempo real + REST de fallback. */
// Navigator não tipado (padrão do projeto, ver ActiveSessionScreen): `any` na
// fronteira e cast interno para RouteParams.
export default function TrainerChatScreen({ navigation, route }: any) {
  const { peerId, peerName, peerAvatarUrl } = (route?.params ?? {}) as RouteParams;
  const { currentUser } = useContext(AuthContext);
  const myId = String(currentUser?.id ?? '');

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [connected, setConnected] = useState(false);
  const [sending, setSending] = useState(false);

  const socketRef = useRef<ChatSocket | null>(null);
  const connectedRef = useRef(false);
  const pageRef = useRef(0);

  // Insere sem duplicar (eco do próprio envio chega também via socket).
  const mergeMessage = (msg: ChatMessage) => {
    setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [msg, ...prev]));
  };

  const loadInitial = async () => {
    try {
      const history = await getMessages(peerId, 0, PAGE_SIZE);
      setMessages(history);
      setHasMore(history.length === PAGE_SIZE);
      pageRef.current = 0;
      await markConversationRead(peerId);
    } catch (error) {
      console.error('Erro ao carregar conversa:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = pageRef.current + 1;
      const older = await getMessages(peerId, nextPage, PAGE_SIZE);
      pageRef.current = nextPage;
      setHasMore(older.length === PAGE_SIZE);
      setMessages((prev) => {
        const seen = new Set(prev.map((m) => m.id));
        return [...prev, ...older.filter((m) => !seen.has(m.id))];
      });
    } catch (error) {
      console.error('Erro ao carregar mensagens antigas:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    void loadInitial();

    socketRef.current = connectChatSocket(
      (msg) => {
        // Só mensagens desta conversa: a fila /user/queue/chat é global do usuário.
        if (msg.senderId !== peerId && msg.recipientId !== peerId) return;
        mergeMessage(msg);
        if (msg.senderId === peerId) void markConversationRead(peerId);
      },
      (isConnected) => {
        connectedRef.current = isConnected;
        setConnected(isConnected);
      },
    );

    // Fallback: re-sincroniza a página mais recente enquanto o WS não conecta.
    const poll = setInterval(() => {
      if (connectedRef.current) return;
      void getMessages(peerId, 0, PAGE_SIZE)
        .then((history) => {
          setMessages((prev) => {
            const seen = new Set(prev.map((m) => m.id));
            const fresh = history.filter((m) => !seen.has(m.id));
            return fresh.length ? [...fresh, ...prev] : prev;
          });
        })
        .catch(() => {});
    }, POLL_INTERVAL_MS);

    return () => {
      clearInterval(poll);
      socketRef.current?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerId]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content || sending) return;
    setInput('');

    // Caminho rápido: STOMP. O eco do backend insere a mensagem na lista.
    if (socketRef.current?.send(peerId, content)) return;

    // Fallback REST quando o socket está fora.
    setSending(true);
    try {
      const saved = await sendMessageRest(peerId, content);
      mergeMessage(saved);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setInput(content); // devolve o texto para o usuário tentar de novo
    } finally {
      setSending(false);
    }
  };

  const renderItem: ListRenderItem<ChatMessage> = ({ item }) => {
    const mine = item.senderId === myId;
    return (
      <View style={[st.bubbleRow, mine ? st.bubbleRowMine : st.bubbleRowTheirs]}>
        <View style={[st.bubble, mine ? st.bubbleMine : st.bubbleTheirs]}>
          <Text style={mine ? st.bubbleTextMine : st.bubbleTextTheirs}>{item.content}</Text>
          <Text style={[st.bubbleTime, mine ? st.bubbleTimeMine : st.bubbleTimeTheirs]}>
            {formatTime(item.sentAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={st.safe} edges={['top']}>
      {/* Header */}
      <View style={st.header}>
        <TouchableOpacity style={st.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={20} color={KINETIC.text} />
        </TouchableOpacity>
        <Image source={{ uri: avatarFallback(peerId, peerAvatarUrl) }} style={st.headerAvatar} />
        <View style={st.headerInfo}>
          <Text style={st.headerName} numberOfLines={1}>{peerName}</Text>
          <Text style={st.headerStatus}>
            {connected ? 'Tempo real conectado' : 'Sincronizando…'}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={st.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {loading ? (
          <View style={st.loadingWrap}>
            <ActivityIndicator size="small" color={KINETIC.primary} />
          </View>
        ) : (
          <FlatList
            data={messages}
            inverted
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={st.listContent}
            onEndReached={loadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              loadingMore ? <ActivityIndicator size="small" color={KINETIC.textMuted} /> : null
            }
            ListEmptyComponent={
              <View style={st.emptyWrap}>
                <Text style={st.emptyText}>
                  Comece a conversa com {peerName.split(' ')[0]} 👋
                </Text>
              </View>
            }
          />
        )}

        {/* Input bar */}
        <View style={st.inputBar}>
          <TextInput
            style={st.input}
            value={input}
            onChangeText={setInput}
            placeholder="Escreva uma mensagem…"
            placeholderTextColor={KINETIC.textMuted}
            multiline
            maxLength={4000}
          />
          <TouchableOpacity
            style={[st.sendBtn, (!input.trim() || sending) && st.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || sending}
            activeOpacity={0.8}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#001a1f" />
            ) : (
              <Icon name="send" size={18} color="#001a1f" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: KINETIC.bg },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: KINETIC.ghost,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 11,
    backgroundColor: KINETIC.surface1,
    alignItems: 'center', justifyContent: 'center',
  },
  headerAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: KINETIC.surface2 },
  headerInfo: { flex: 1, minWidth: 0 },
  headerName: { color: KINETIC.text, fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  headerStatus: { color: KINETIC.textMuted, fontSize: 11, marginTop: 1 },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },

  bubbleRow: { flexDirection: 'row' },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubbleRowTheirs: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '80%',
    borderRadius: 16,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  bubbleMine: { backgroundColor: KINETIC.primary, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: KINETIC.surface1, borderBottomLeftRadius: 4 },
  bubbleTextMine: { color: '#001a1f', fontSize: 14.5, lineHeight: 20 },
  bubbleTextTheirs: { color: KINETIC.text, fontSize: 14.5, lineHeight: 20 },
  bubbleTime: { fontSize: 10, marginTop: 3, alignSelf: 'flex-end' },
  bubbleTimeMine: { color: 'rgba(0,26,31,0.55)' },
  bubbleTimeTheirs: { color: KINETIC.textMuted },

  // FlatList invertida: o "empty" renderiza de cabeça para baixo sem isso.
  emptyWrap: { transform: [{ scaleY: -1 }], paddingVertical: 48, alignItems: 'center' },
  emptyText: { color: KINETIC.textMuted, fontSize: 13 },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: KINETIC.ghost,
    backgroundColor: KINETIC.bg,
  },
  input: {
    flex: 1,
    maxHeight: 110,
    backgroundColor: KINETIC.surface1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14.5,
    color: KINETIC.text,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: KINETIC.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});
