import {
  useEffect,
  useRef,
  useState,
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
import { Send, Wifi, WifiOff, Loader2, Sparkles } from 'lucide-react';
import type { ChatMessage } from '../types';

interface Props {
  peerId: string;
  peerName: string;
}

const PAGE_SIZE = 30;
const POLL_INTERVAL_MS = 10000;

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

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
        if (msg.senderId !== peerId && msg.recipientId !== peerId) return;
        mergeMessage(msg);
        if (msg.senderId === peerId) void markConversationRead(peerId);
      },
      (isConnected) => {
        connectedRef.current = isConnected;
        setConnected(isConnected);
      },
    );

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

    if (socketRef.current?.send(peerId, content)) return;

    setSending(true);
    try {
      const saved = await sendMessageRest(peerId, content);
      mergeMessage(saved);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setInput(content);
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

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const distanceToTop = el.scrollHeight - el.clientHeight + el.scrollTop;
    if (distanceToTop < 120) void loadMore();
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-k-bg text-k-text">
      {/* Real-time Status Bar */}
      <div className="flex items-center justify-between px-6 py-2.5 border-b border-k-ghost/40 bg-k-surface1/30">
        <div className="flex items-center gap-2">
          {connected ? (
            <Wifi className="w-3.5 h-3.5 text-k-success" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-k-warn animate-pulse" />
          )}
          <span className="text-[11px] font-bold uppercase tracking-wider text-k-text-muted">
            {connected ? 'Canal em tempo real conectado' : 'Conexão limitada, sincronizando histórico...'}
          </span>
        </div>
        <span className="text-[10px] font-bold text-k-primary bg-k-primary-dim px-2 py-0.5 border border-k-primary-soft rounded-full uppercase tracking-wider">
          Chat do Personal
        </span>
      </div>

      {/* Message List */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-k-text-muted">
          <Loader2 className="w-6 h-6 animate-spin text-k-primary" />
          <p className="text-xs font-semibold uppercase tracking-wider">Buscando conversa…</p>
        </div>
      ) : (
        <div
          ref={listRef}
          onScroll={handleScroll}
          className="flex-1 min-h-0 overflow-y-auto flex flex-col-reverse gap-4 px-6 py-6"
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-k-primary-dim border border-k-primary-soft flex items-center justify-center text-k-primary">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="max-w-[280px]">
                <p className="font-extrabold text-sm text-k-text-dim">Nova conversa iniciada</p>
                <p className="text-xs text-k-text-muted mt-1 leading-relaxed">
                  Envie uma mensagem para {peerName.split(' ')[0]} para orientá-lo ou debater feedbacks dos treinos.
                </p>
              </div>
            </div>
          )}
          
          {messages.map((item) => {
            const mine = item.senderId === myId;
            return (
              <div
                key={item.id}
                className={`flex w-full ${mine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] sm:max-w-[60%] flex flex-col gap-1 p-3.5 shadow-md ${
                    mine
                      ? 'bg-k-primary text-k-on-primary rounded-2xl rounded-tr-xs font-medium'
                      : 'bg-k-surface1 border border-k-ghost text-k-text rounded-2xl rounded-tl-xs'
                  }`}
                >
                  <span className="text-sm leading-relaxed whitespace-pre-wrap break-words">{item.content}</span>
                  <span
                    className={`text-[9px] font-bold self-end mt-1 ${
                      mine ? 'text-k-on-primary/60' : 'text-k-text-muted'
                    }`}
                  >
                    {formatTime(item.sentAt)}
                  </span>
                </div>
              </div>
            );
          })}
          
          {loadingMore && (
            <div className="text-center py-2 flex items-center justify-center gap-2 text-xs text-k-text-muted font-bold uppercase tracking-wider">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-k-primary" />
              <span>Carregando histórico anterior…</span>
            </div>
          )}
        </div>
      )}

      {/* Input Bar */}
      <div className="p-4 border-t border-k-ghost/40 bg-k-surface1/40 backdrop-blur-md flex items-end gap-3 shrink-0">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escreva uma orientação profissional… (Enter envia, Shift+Enter quebra linha)"
          rows={1}
          maxLength={4000}
          className="flex-1 bg-k-surface2/80 border border-k-ghost rounded-xl px-4 py-3 text-sm max-h-32 resize-none outline-none focus:border-k-primary focus:ring-1 focus:ring-k-primary/30 transition-all placeholder:text-k-text-muted"
        />
        <button
          onClick={() => void handleSend()}
          disabled={!input.trim() || sending}
          aria-label="Enviar"
          className="w-11 h-11 rounded-xl bg-k-primary hover:bg-k-primary-deep text-k-on-primary shadow-md hover:shadow-[0_0_12px_rgba(0,229,255,0.25)] flex items-center justify-center transition-all shrink-0 active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          {sending ? (
            <Loader2 className="w-4.5 h-4.5 animate-spin" />
          ) : (
            <Send className="w-4.5 h-4.5 stroke-[2.5]" />
          )}
        </button>
      </div>
    </div>
  );
}
