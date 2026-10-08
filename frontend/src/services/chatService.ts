import AsyncStorage from '@react-native-async-storage/async-storage';

import { MOCK_ONLINE_PROPERTY_IDS, mockOwnerReply, seedMessages } from '@/mocks/chats';
import { MOCK_PROPERTIES } from '@/mocks/properties';
import type { Result } from '@/types/auth';
import type { ChatMessage, ChatState, MessageStatus } from '@/types/chat';

const CHATS_KEY = 'basha-lagbe:chats';
export const MESSAGE_MAX_LENGTH = 1000;

type Listener = (state: ChatState) => void;

// In-memory copy of every conversation, saved to AsyncStorage on change.
let store: Record<string, ChatMessage[]> | null = null;
const typing: Record<string, boolean> = {};
const listeners: Record<string, Set<Listener>> = {};
const replyTimers: Record<string, ReturnType<typeof setTimeout>[]> = {};

async function load() {
  if (store) return store;
  try {
    const raw = await AsyncStorage.getItem(CHATS_KEY);
    store = raw ? (JSON.parse(raw) as Record<string, ChatMessage[]>) : {};
  } catch {
    store = {};
  }
  return store;
}

async function save() {
  try {
    await AsyncStorage.setItem(CHATS_KEY, JSON.stringify(store ?? {}));
  } catch {
    // ignore
  }
}

const propertyIdOf = (conversationId: string) => conversationId.replace(/^c_/, '');

function emit(conversationId: string) {
  const state: ChatState = {
    messages: store?.[conversationId] ?? [],
    ownerTyping: typing[conversationId] ?? false,
  };
  listeners[conversationId]?.forEach((l) => l(state));
}

function setStatus(conversationId: string, status: MessageStatus) {
  if (!store) return;
  store[conversationId] = (store[conversationId] ?? []).map((m) =>
    m.sender === 'me' && m.status !== 'read' ? { ...m, status } : m,
  );
  emit(conversationId);
  save();
}

/** MOCK: the owner "reads" and answers a few seconds later. */
function simulateOwner(conversationId: string, lastText: string) {
  replyTimers[conversationId]?.forEach(clearTimeout);
  const online = MOCK_ONLINE_PROPERTY_IDS.includes(propertyIdOf(conversationId));
  const property = MOCK_PROPERTIES.find((p) => p.id === propertyIdOf(conversationId));
  const later = (ms: number, fn: () => void) => setTimeout(fn, ms);

  replyTimers[conversationId] = [
    later(800, () => setStatus(conversationId, 'delivered')),
    ...(online
      ? [
          later(1800, () => setStatus(conversationId, 'read')),
          later(2500, () => {
            typing[conversationId] = true;
            emit(conversationId);
          }),
          later(4500, () => {
            typing[conversationId] = false;
            const reply: ChatMessage = {
              id: `m_${Date.now()}`,
              conversationId,
              sender: 'owner',
              text: mockOwnerReply(lastText, property),
              createdAt: new Date().toISOString(),
              status: 'read',
            };
            store![conversationId] = [...(store![conversationId] ?? []), reply];
            emit(conversationId);
            save();
          }),
        ]
      : []),
  ];
}

// MOCK service — will use the backend API + WebSocket later.
export const chatService = {
  /** One conversation per property for the logged-in tenant. */
  conversationIdFor(propertyId: string) {
    return `c_${propertyId}`;
  },

  propertyIdOf,

  isOwnerOnline(propertyId: string) {
    return MOCK_ONLINE_PROPERTY_IDS.includes(propertyId);
  },

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    const s = await load();
    if (!s[conversationId]) {
      s[conversationId] = seedMessages(conversationId, propertyIdOf(conversationId));
      save();
    }
    return s[conversationId];
  },

  /** Live updates (new messages, ticks, typing). Returns an unsubscribe function. */
  subscribe(conversationId: string, listener: Listener) {
    (listeners[conversationId] ??= new Set()).add(listener);
    return () => {
      listeners[conversationId]?.delete(listener);
    };
  },

  async send(conversationId: string, text: string): Promise<Result<ChatMessage>> {
    const body = text.trim();
    if (!body) return { ok: false, error: 'Message is empty.' };
    if (body.length > MESSAGE_MAX_LENGTH) return { ok: false, error: 'Message is too long.' };

    const s = await load();
    const message: ChatMessage = {
      id: `m_${Date.now()}`,
      conversationId,
      sender: 'me',
      text: body,
      createdAt: new Date().toISOString(),
      status: 'sent',
    };
    s[conversationId] = [...(s[conversationId] ?? []), message];
    emit(conversationId);
    await save();
    simulateOwner(conversationId, body);
    return { ok: true, data: message };
  },
};