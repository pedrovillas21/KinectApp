import { Client, type IMessage } from '@stomp/stompjs';
import api from './api';
import { getAccessToken } from './tokenStorage';
import type { ChatMessage } from '../types';

/**
 * Chat personal↔aluno. Histórico/leitura via REST; tempo real via STOMP
 * sobre WebSocket. O JWT vai no header do frame CONNECT (connectHeaders) —
 * browsers/RN não enviam header HTTP Authorization no handshake nativo —
 * com ?token= na URL como fallback (ambos aceitos pelo backend).
 */

// ─── REST ─────────────────────────────────────────────────────

export const getMessages = async (
  peerId: string,
  page = 0,
  size = 30,
): Promise<ChatMessage[]> => {
  const res = await api.get<ChatMessage[]>(`/chat/${peerId}/messages`, {
    params: { page, size },
  });
  return res.data;
};

/** Envio via REST — fallback quando o WebSocket não está conectado. */
export const sendMessageRest = async (
  peerId: string,
  content: string,
): Promise<ChatMessage> => {
  const res = await api.post<ChatMessage>(`/chat/${peerId}/messages`, {
    recipientId: peerId,
    content,
  });
  return res.data;
};

export const markConversationRead = async (peerId: string): Promise<void> => {
  await api.post(`/chat/${peerId}/read`);
};

export const getUnreadCount = async (): Promise<number> => {
  const res = await api.get<{ count: number }>('/chat/unread-count');
  return res.data.count;
};

// ─── STOMP (tempo real) ───────────────────────────────────────

export interface ChatSocket {
  /** Publica uma mensagem via STOMP. Retorna false se desconectado (use o REST). */
  send: (recipientId: string, content: string) => boolean;
  isConnected: () => boolean;
  disconnect: () => void;
}

const WS_URL = `${(import.meta.env.VITE_API_URL ?? '').replace(/^http/, 'ws')}/ws`;

/**
 * Abre a conexão STOMP e assina a fila pessoal (/user/queue/chat).
 * `onMessage` recebe tanto mensagens do peer quanto as confirmações das
 * próprias mensagens (o backend ecoa para os dois lados).
 */
export const connectChatSocket = (
  onMessage: (msg: ChatMessage) => void,
  onConnectionChange?: (connected: boolean) => void,
): ChatSocket => {
  const client = new Client({
    // Token resolvido a cada (re)conexão — sobrevive à rotação do refresh.
    beforeConnect: async () => {
      const token = await getAccessToken();
      client.connectHeaders = { Authorization: `Bearer ${token ?? ''}` };
      client.brokerURL = `${WS_URL}?token=${encodeURIComponent(token ?? '')}`;
    },
    brokerURL: WS_URL,
    reconnectDelay: 5000,
    onConnect: () => {
      onConnectionChange?.(true);
      client.subscribe('/user/queue/chat', (frame: IMessage) => {
        try {
          onMessage(JSON.parse(frame.body) as ChatMessage);
        } catch {
          // payload inesperado: ignora em vez de derrubar o listener
        }
      });
    },
    onWebSocketClose: () => onConnectionChange?.(false),
    onStompError: () => onConnectionChange?.(false),
  });

  try {
    client.activate();
  } catch {
    // Ambiente sem suporte — a tela cai para REST+polling.
    onConnectionChange?.(false);
  }

  return {
    send: (recipientId: string, content: string): boolean => {
      if (!client.connected) return false;
      client.publish({
        destination: '/app/chat.send',
        body: JSON.stringify({ recipientId, content }),
      });
      return true;
    },
    isConnected: () => client.connected,
    disconnect: () => {
      void client.deactivate();
    },
  };
};
