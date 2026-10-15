import type { ImageSourcePropType } from 'react-native';

export type ChatSender = 'me' | 'them';

/** sent = saved on our server, read = the other person opened the chat. */
export type MessageStatus = 'sent' | 'read';

export type ChatMessage = {
  id: string;
  conversationId: string;
  sender: ChatSender;
  text: string;
  /** ISO timestamp. */
  createdAt: string;
  status: MessageStatus;
};

export type ChatRole = 'tenant' | 'owner';

/** One chat (a row on the Messages tab, and the header of a chat screen). */
export type ChatSummary = {
  id: string;
  /** Am I the tenant or the owner in this chat? */
  myRole: ChatRole;
  property: {
    id: string;
    title: string;
    areaLabel: string;
    monthlyRent: number;
    image: ImageSourcePropType | null;
  };
  /** The other person. */
  other: { id: string; name: string; phone: string; isVerified: boolean; role: ChatRole };
  lastMessage: { text: string; mine: boolean; createdAt: string; read: boolean } | null;
  unreadCount: number;
};