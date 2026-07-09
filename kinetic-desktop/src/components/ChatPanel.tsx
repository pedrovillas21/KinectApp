import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type UIEvent,
} from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  connectChatSocket,
  getMessages,
  markConversationRead,
  sendMessageRest,
  type ChatSocket,
} from '../services/chatService';
import { KINETIC } from '../theme/kinetic';
import type { ChatMessage } from '../types';

interface Props {
  peerId: string;
  peerName: string;
}

const PAGE_SIZE = 30;
// Sem WebSocket (rede restritiva, proxy…) o histórico é re-sincronizado por
// polling — chat continua funcional, só menos imediato.
const POLL_INTERVAL_MS = 10000;

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * Conversa personal↔aluno — porta o state machine do TrainerChatScreen do
 * mobile: paginação por PAGE_SIZE, dedupe por id, envio STOMP-first com
 * fallback REST e polling só enquanto o socket está fora. A lista usa
 * column-reverse (equivalente DOM da FlatList invertida): messages[0] é a
 * mais recente e fica no fundo.
 */
export default function ChatPanel({ peerId, peerName }: Props) {
  const { currentUser } = useAuth();
  const myId = String(currentUser?.id ?? '');

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [connected, setConnected] = useState(false);
  const [sending, setSending] = useState(false);

  const socketRef = useRef<ChatSocket | null>(null);
  const connectedRef = useRef(false);
  const pageRef = useRef(0);
  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(true);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Insere sem duplicar (eco do próprio envio chega também via socket).
  const mergeMessage = (msg: ChatMessage) => {
    setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [msg, ...prev]));
  };

  const loadInitial = async () => {
    try {
      const history = await getMessages(peerId, 0, PAGE_SIZE);
      setMessages(history);
      hasMoreRef.current = history.length === PAGE_SIZE;
      pageRef.current = 0;
      await markConversationRead(peerId);
    } catch (error) {
      console.error('Erro ao carregar conversa:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (loadingMoreRef.current || !hasMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const nextPage = pageRef.current + 1;
      const older = await getMessages(peerId, nextPage, PAGE_SIZE);
      pageRef.current = nextPage;
      hasMoreRef.current = older.length === PAGE_SIZE;
      setMessages((prev) => {
        const seen = new Set(prev.map((m) => m.id));
        return [...prev, ...older.filter((m) => !seen.has(m.id))];
      });
    } catch (error) {
      console.error('Erro ao carregar mensagens antigas:', error);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setMessages([]);
    hasMoreRef.current = true;
    pageRef.current = 0;

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
      socketRef.current = null;
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

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  // Com column-reverse, o scroll "para cima" caminha para scrollTop negativo:
  // perto do topo visual (fim do histórico carregado) → busca a próxima página.
  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const distanceToTop = el.scrollHeight - el.clientHeight + el.scrollTop;
    if (distanceToTop < 120) void loadMore();
  };

  return (
    <div style={st.panel}>
      <div style={st.statusBar}>
        <span
          style={{
            ...st.statusDot,
            background: connected ? KINETIC.success : KINETIC.warn,
          }}
        />
        <span style={st.statusText}>
          {connected ? 'Tempo real conectado' : 'Sincronizando…'}
        </span>
      </div>

      {loading ? (
        <div style={st.loadingWrap}>Carregando conversa…</div>
      ) : (
        <div ref={listRef} style={st.list} onScroll={handleScroll}>
          {/* column-reverse: primeiro filho = mensagem mais recente, no fundo. */}
          {messages.length === 0 && (
            <div style={st.emptyWrap}>
              Comece a conversa com {peerName.split(' ')[0]} 👋
            </div>
          )}
          {messages.map((item) => {
            const mine = item.senderId === myId;
            return (
              <div
                key={item.id}
                style={{
                  ...st.bubbleRow,
                  justifyContent: mine ? 'flex-end' : 'flex-start',
                }}
              >
                <div style={{ ...st.bubble, ...(mine ? st.bubbleMine : st.bubbleTheirs) }}>
                  <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {item.content}
                  </span>
                  <span
                    style={{
                      ...st.bubbleTime,
                      color: mine ? 'rgba(0,26,31,0.55)' : KINETIC.textMuted,
                    }}
                  >
                    {formatTime(item.sentAt)}
                  </span>
                </div>
              </div>
            );
          })}
          {loadingMore && <div style={st.loadingMore}>Carregando mensagens antigas…</div>}
        </div>
      )}

      <div style={st.inputBar}>
        <textarea
          style={st.textarea}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escreva uma mensagem… (Enter envia, Shift+Enter quebra linha)"
          rows={1}
          maxLength={4000}
        />
        <button
          style={{
            ...st.sendBtn,
            opacity: !input.trim() || sending ? 0.4 : 1,
          }}
          onClick={() => void handleSend()}
          disabled={!input.trim() || sending}
          aria-label="Enviar"
        >
          {sending ? '…' : '➤'}
        </button>
      </div>
    </div>
  );
}

const st: Record<string, CSSProperties> = {
  panel: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  statusBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    padding: '8px 20px',
    borderBottom: `1px solid ${KINETIC.ghost}`,
  },
  statusDot: { width: 8, height: 8, borderRadius: '50%' },
  statusText: { fontSize: 11.5, color: KINETIC.textMuted },
  loadingWrap: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: KINETIC.textMuted,
    fontSize: 13,
  },
  list: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column-reverse',
    gap: 8,
    padding: '14px 20px',
  },
  emptyWrap: {
    padding: '48px 0',
    textAlign: 'center',
    color: KINETIC.textMuted,
    fontSize: 13,
  },
  loadingMore: {
    textAlign: 'center',
    color: KINETIC.textMuted,
    fontSize: 12,
    padding: '6px 0',
  },
  bubbleRow: { display: 'flex' },
  bubble: {
    maxWidth: '68%',
    borderRadius: 16,
    padding: '9px 13px',
    fontSize: 14.5,
    lineHeight: 1.4,
    display: 'flex',
    flexDirection: 'column',
  },
  bubbleMine: {
    background: KINETIC.primary,
    color: '#001a1f',
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    background: KINETIC.surface1,
    color: KINETIC.text,
    borderBottomLeftRadius: 4,
  },
  bubbleTime: { fontSize: 10, marginTop: 3, alignSelf: 'flex-end' },
  inputBar: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 10,
    padding: '12px 20px',
    borderTop: `1px solid ${KINETIC.ghost}`,
    background: KINETIC.bg,
  },
  textarea: {
    flex: 1,
    resize: 'none',
    maxHeight: 110,
    borderRadius: 16,
    lineHeight: 1.4,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    background: KINETIC.primary,
    color: '#001a1f',
    fontSize: 16,
    fontWeight: 800,
    flexShrink: 0,
  },
};
