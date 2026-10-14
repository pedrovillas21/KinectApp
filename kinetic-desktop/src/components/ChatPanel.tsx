import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type UIEvent,
} from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, CheckCheck, Loader2, Send, Sparkles, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  connectChatSocket,
  getMessages,
  markConversationRead,
  sendMessageRest,
  type ChatSocket,
} from '../services/chatService';
import type { ChatMessage } from '../types';

interface Props {
  peerId: string;
  peerName: string;
  /** Quando informado, mostra o botão de fechar no cabeçalho. */
  onClose?: () => void;
}

const PAGE_SIZE = 30;
const POLL_INTERVAL_MS = 10000;

const QUICK_REPLIES = [
  'Como foi o treino de hoje?',
  'Lembre de registrar seu peso no app.',
  'Ótimo trabalho, continue assim!',
];

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const dayKey = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

function dayLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (dayKey(iso) === dayKey(today.toISOString())) return 'Hoje';
  if (dayKey(iso) === dayKey(yesterday.toISOString())) return 'Ontem';
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
}

export default function ChatPanel({ peerId, peerName, onClose }: Props) {
  const { currentUser } = useAuth();
  const myId = String(currentUser?.id ?? '');
  const firstName = peerName.trim().split(/\s+/)[0] ?? peerName;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [connected, setConnected] = useState(false);
  const [sending, setSending] = useState(false);
  /** Mensagem recebida não lida mais antiga no momento da abertura. */
  const [firstUnread, setFirstUnread] = useState<{ id: string; count: number } | null>(null);

  const socketRef = useRef<ChatSocket | null>(null);
  const connectedRef = useRef(false);
  const pageRef = useRef(0);
  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(true);
  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const mergeMessage = (msg: ChatMessage) => {
    setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [msg, ...prev]));
  };

  const loadInitial = async () => {
    try {
      const history = await getMessages(peerId, 0, PAGE_SIZE);
      setMessages(history);
      hasMoreRef.current = history.length === PAGE_SIZE;
      pageRef.current = 0;

      // history vem da mais nova para a mais antiga: a última não lida
      // encontrada é a mais antiga — o divisor "novas mensagens" fica acima dela.
      const unread = history.filter((m) => m.senderId === peerId && !m.readAt);
      setFirstUnread(
        unread.length ? { id: unread[unread.length - 1].id, count: unread.length } : null,
      );

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
    setFirstUnread(null);
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

  // Textarea cresce com o texto (até ~5 linhas).
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [input]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content || sending) return;
    setInput('');
    // Respondeu: o aviso de "novas mensagens" já cumpriu o papel.
    setFirstUnread(null);

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

  const applyQuickReply = (text: string) => {
    setInput(text);
    inputRef.current?.focus();
  };

  // A lista usa flex-col-reverse (mais nova embaixo): o que deve aparecer
  // ACIMA de uma mensagem vem DEPOIS dela no DOM.
  const items: ReactNode[] = [];
  messages.forEach((item, i) => {
    const mine = item.senderId === myId;
    items.push(
      <motion.div
        key={item.id}
        initial={{ opacity: 0, y: 10, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        className={`flex w-full ${mine ? 'justify-end' : 'justify-start'}`}
        style={{ transformOrigin: mine ? 'bottom right' : 'bottom left' }}
      >
        <div
          className={`max-w-[84%] px-3.5 py-2.5 text-sm leading-[1.45] ${
            mine
              ? 'rounded-[16px_16px_4px_16px] bg-k-primary text-k-on-primary'
              : 'rounded-[16px_16px_16px_4px] border border-white/[0.06] bg-[#242424] text-k-text'
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{item.content}</p>
          <p
            className={`mt-1 flex items-center justify-end gap-1 text-[11px] font-semibold ${
              mine ? 'text-k-on-primary/70' : 'text-k-text-muted'
            }`}
          >
            {formatTime(item.sentAt)}
            {mine &&
              (item.readAt ? (
                <CheckCheck className="h-3.5 w-3.5" aria-label="Lida" />
              ) : (
                <Check className="h-3.5 w-3.5" aria-label="Enviada" />
              ))}
          </p>
        </div>
      </motion.div>,
    );

    if (firstUnread?.id === item.id) {
      items.push(
        <motion.div
          key={`unread-${item.id}`}
          exit={{ opacity: 0, height: 0 }}
          className="my-1 flex justify-center"
        >
          <span className="rounded-full bg-k-primary/10 px-2.5 py-0.5 text-[11.5px] font-bold text-k-primary">
            {firstUnread.count === 1 ? '1 nova mensagem' : `${firstUnread.count} novas mensagens`}
          </span>
        </motion.div>,
      );
    }

    const older = messages[i + 1];
    if (!older || dayKey(older.sentAt) !== dayKey(item.sentAt)) {
      items.push(
        <div key={`day-${item.id}`} className="mb-1 mt-2 flex items-center gap-2.5">
          <span className="h-px flex-1 bg-white/[0.07]" />
          <span className="text-[11.5px] font-semibold text-k-text-muted">{dayLabel(item.sentAt)}</span>
          <span className="h-px flex-1 bg-white/[0.07]" />
        </div>,
      );
    }
  });

  return (
    <div className="flex h-full min-h-0 flex-col bg-k-surface1 text-k-text">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.06] py-3.5 pl-[18px] pr-4">
        <div className="min-w-0">
          <h2 className="font-display text-base font-bold font-stretch-semi-expanded">Conversa</h2>
          <p className="flex items-center gap-1.5 text-xs text-k-text-muted">
            <span
              className={`h-[7px] w-[7px] rounded-full ${connected ? 'k-live-dot bg-k-success' : 'bg-k-warn'}`}
            />
            {connected ? 'Conectado em tempo real' : 'Reconectando… sincronizando a cada 10 s'}
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar conversa"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-k-surface1 text-k-text-dim transition-colors hover:bg-k-surface2 hover:text-k-text"
          >
            <X className="h-[17px] w-[17px]" />
          </button>
        )}
      </div>

      {loading ? (
        <div role="status" aria-label="Carregando conversa" className="flex flex-1 flex-col justify-end gap-3 px-[18px] py-4">
          {['w-[62%]', 'ml-auto w-[48%]', 'w-[70%]', 'ml-auto w-[40%]'].map((cls, i) => (
            <div
              key={cls}
              className={`k-skeleton h-11 rounded-2xl ${i % 2 ? 'bg-k-primary/[0.12]' : 'bg-[#242424]'} ${cls}`}
              style={{ animationDelay: `${i * 120}ms` }}
            />
          ))}
        </div>
      ) : (
        <div
          ref={listRef}
          onScroll={handleScroll}
          aria-live="polite"
          className="flex min-h-0 flex-1 flex-col-reverse gap-2 overflow-y-auto px-[18px] py-4"
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-k-primary-soft bg-k-primary-dim text-k-primary">
                <Sparkles className="k-twinkle h-5 w-5" />
              </div>
              <div className="max-w-[260px]">
                <p className="text-sm font-bold text-k-text-soft">Nenhuma mensagem ainda</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-k-text-muted">
                  Envie uma orientação para {firstName} ou use uma das respostas rápidas abaixo.
                </p>
              </div>
            </div>
          )}

          <AnimatePresence initial={false}>{items}</AnimatePresence>

          {loadingMore && (
            <div className="flex items-center justify-center gap-2 py-2 text-xs font-semibold text-k-text-muted">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-k-primary" />
              Carregando mensagens anteriores…
            </div>
          )}
        </div>
      )}

      <div className="flex shrink-0 flex-wrap gap-2 border-t border-white/[0.06] px-4 pt-3">
        {QUICK_REPLIES.map((text) => (
          <button
            key={text}
            type="button"
            onClick={() => applyQuickReply(text)}
            className="min-h-10 rounded-full border border-white/[0.08] bg-[#242424] px-3.5 py-1.5 text-[12.5px] font-semibold text-k-text-soft transition-[background-color,color,border-color,translate] hover:-translate-y-px hover:border-k-primary/30 hover:bg-k-primary/10 hover:text-k-primary"
          >
            {text}
          </button>
        ))}
      </div>

      <div className="flex shrink-0 items-end gap-2.5 px-4 pb-4 pt-3">
        <label htmlFor={`chat-input-${peerId}`} className="sr-only">
          Mensagem para {firstName}
        </label>
        <textarea
          id={`chat-input-${peerId}`}
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escreva uma mensagem…"
          rows={1}
          maxLength={4000}
          className="max-h-[120px] min-h-11 flex-1 resize-none rounded-xl border border-white/10 bg-[#242424] px-3.5 py-[11px] text-sm leading-[1.45] transition-[border-color,box-shadow] placeholder:text-k-text-muted focus:border-k-primary focus:shadow-[0_0_0_4px_rgba(0,229,255,0.12)]"
        />
        <motion.button
          type="button"
          onClick={() => void handleSend()}
          disabled={!input.trim() || sending}
          aria-label="Enviar mensagem"
          whileTap={{ scale: 0.92 }}
          className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-k-primary text-k-on-primary transition-[box-shadow,opacity] hover:shadow-[0_0_0_4px_rgba(0,229,255,0.14),0_10px_26px_-10px_rgba(0,229,255,0.8)] disabled:pointer-events-none disabled:opacity-40"
        >
          {sending ? (
            <Loader2 className="h-[18px] w-[18px] animate-spin" />
          ) : (
            <Send className="h-[18px] w-[18px] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          )}
        </motion.button>
      </div>
    </div>
  );
}
