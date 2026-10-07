export type ChatSender = 'me' | 'owner';

/** sent = reached our server, delivered = reached the owner's phone, read = owner opened it. */
export type MessageStatus = 'sent' | 'delivered' | 'read';

export type ChatMessage = {
  id: string;
  conversationId: string;
  sender: ChatSender;
  text: string;
  /** ISO timestamp. */
  createdAt: string;
  status: MessageStatus;
};

/** What a chat screen listens to. */
export type ChatState = {
  messages: ChatMessage[];
  ownerTyping: boolean;
};