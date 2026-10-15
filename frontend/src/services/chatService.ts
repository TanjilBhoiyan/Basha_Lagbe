import { io, type Socket } from 'socket.io-client';

import type { Result } from '@/types/auth';
import type { ChatMessage, ChatSummary } from '@/types/chat';

import { API_URL, apiImage, apiRequest } from './apiClient';
import { session } from './session';

export const MESSAGE_MAX_LENGTH = 1000;

type ApiChat = Omit<ChatSummary, 'property'> & {
  property: Omit<ChatSummary['property'], 'image'> & { image: string | null };
};

const toSummary = ({ property, ...c }: ApiChat): ChatSummary => ({
  ...c,
  property: { ...property, image: property.image ? apiImage(property.image) : null },
});

type ReadEvent = { conversationId: string; readAt: string };

const messageListeners = new Set<(m: ChatMessage) => void>();
const readListeners = new Set<(e: ReadEvent) => void>();
/** Anything that changes the inbox (new message, chat read) — the list and the tab badge refresh. */
const inboxListeners = new Set<() => void>();

let socket: Socket | null = null;
let socketToken: string | null = null;

const notifyInbox = () => inboxListeners.forEach((l) => l());

/** Real-time connection, opened once per login. A new login (different token) reconnects. */
async function connect() {
  const token = await session.getToken();
  if (!token) return;
  if (socket && socketToken === token) return;
  socket?.disconnect();
  socketToken = token;
  socket = io(API_URL, { auth: { token }, transports: ['websocket'] });
  socket.on('chat:message', (m: ChatMessage) => {
    messageListeners.forEach((l) => l(m));
    notifyInbox();
  });
  socket.on('chat:read', (e: ReadEvent) => {
    readListeners.forEach((l) => l(e));
    notifyInbox();
  });
  socket.on('chat:read-by-me', notifyInbox);
}

const listen = <T>(set: Set<T>, listener: T) => {
  set.add(listener);
  connect();
  return () => {
    set.delete(listener);
  };
};

/** Chat between a tenant and an owner about one listing (backend: /chats + Socket.IO). */
export const chatService = {
  connect,

  /** Tenant taps "Message" on a listing: opens (or reuses) the chat with its owner. */
  async openForProperty(propertyId: string): Promise<Result<ChatSummary>> {
    const result = await apiRequest<ApiChat>('/chats', { method: 'POST', auth: true, body: { propertyId } });
    return result.ok ? { ok: true, data: toSummary(result.data) } : result;
  },

  /** Messages tab, newest first. */
  async list(): Promise<ChatSummary[]> {
    const result = await apiRequest<ApiChat[]>('/chats', { auth: true });
    return result.ok ? result.data.map(toSummary) : [];
  },

  async get(id: string): Promise<ChatSummary | null> {
    const result = await apiRequest<ApiChat>(`/chats/${encodeURIComponent(id)}`, { auth: true });
    return result.ok ? toSummary(result.data) : null;
  },

  /** Unread messages in all my chats (tab badge). */
  async unreadCount(): Promise<number> {
    const result = await apiRequest<{ count: number }>('/chats/unread-count', { auth: true });
    return result.ok ? result.data.count : 0;
  },

  /** Oldest first. `before` (ISO time) loads the previous page. */
  async getMessages(id: string, before?: string): Promise<Result<ChatMessage[]>> {
    const query = before ? `?before=${encodeURIComponent(before)}` : '';
    return apiRequest<ChatMessage[]>(`/chats/${encodeURIComponent(id)}/messages${query}`, { auth: true });
  },

  async send(id: string, text: string): Promise<Result<ChatMessage>> {
    const body = text.trim();
    if (!body) return { ok: false, error: 'Message is empty.' };
    if (body.length > MESSAGE_MAX_LENGTH) return { ok: false, error: 'Message is too long.' };
    return apiRequest<ChatMessage>(`/chats/${encodeURIComponent(id)}/messages`, {
      method: 'POST',
      auth: true,
      body: { text: body },
    });
  },

  /** I've seen this chat (the other person gets green ticks, my badge goes down). */
  async markRead(id: string): Promise<void> {
    await apiRequest<null>(`/chats/${encodeURIComponent(id)}/read`, { method: 'POST', auth: true });
  },

  /** A new message in any of my chats (mine from another device too). Returns unsubscribe. */
  onMessage: (listener: (m: ChatMessage) => void) => listen(messageListeners, listener),
  /** The other person read a chat. */
  onRead: (listener: (e: ReadEvent) => void) => listen(readListeners, listener),
  onInboxChange: (listener: () => void) => listen(inboxListeners, listener),
};