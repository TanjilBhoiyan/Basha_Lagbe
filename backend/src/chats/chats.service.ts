import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import type { Conversation, Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ChatsGateway } from './chats.gateway.js';

const PAGE_SIZE = 50;
const EPOCH = new Date(0);

const SUMMARY_INCLUDE = {
  property: {
    select: {
      id: true,
      title: true,
      areaLabel: true,
      monthlyRent: true,
      status: true,
      images: { orderBy: { sortOrder: 'asc' }, take: 1, select: { url: true } },
    },
  },
  tenant: { select: { id: true, fullName: true, phone: true, identityVerified: true, avatarUrl: true } },
  owner: { select: { id: true, fullName: true, phone: true, identityVerified: true, avatarUrl: true } },
  messages: { orderBy: { createdAt: 'desc' }, take: 1 },
} satisfies Prisma.ConversationInclude;

type ConversationWithSummary = Prisma.ConversationGetPayload<{ include: typeof SUMMARY_INCLUDE }>;
type MessageRow = { id: string; conversationId: string; senderId: string; text: string; createdAt: Date };

/** A message as one person sees it: "me" or "them", and whether the other person has read it. */
export type ApiMessage = {
  id: string;
  conversationId: string;
  sender: 'me' | 'them';
  text: string;
  createdAt: string;
  status: 'sent' | 'read';
};

/** One row of the Messages tab. */
export type ApiChat = {
  id: string;
  /** Am I the tenant or the owner in this chat? */
  myRole: 'tenant' | 'owner';
  property: { id: string; title: string; areaLabel: string; monthlyRent: number; status: string; image: string | null };
  /** The other person. */
  other: {
    id: string;
    name: string;
    phone: string;
    isVerified: boolean;
    /** Profile photo URL, or null (the app shows initials). */
    avatarUrl: string | null;
    role: 'tenant' | 'owner';
  };
  lastMessage: { text: string; mine: boolean; createdAt: string; read: boolean } | null;
  unreadCount: number;
};

const myRole = (c: Conversation, userId: string) => (c.tenantId === userId ? 'tenant' : 'owner');
const myLastRead = (c: Conversation, userId: string) =>
  (myRole(c, userId) === 'tenant' ? c.tenantLastReadAt : c.ownerLastReadAt) ?? EPOCH;
const otherLastRead = (c: Conversation, userId: string) =>
  (myRole(c, userId) === 'tenant' ? c.ownerLastReadAt : c.tenantLastReadAt) ?? EPOCH;

function toApiMessage(m: MessageRow, viewerId: string, otherReadAt: Date): ApiMessage {
  const mine = m.senderId === viewerId;
  return {
    id: m.id,
    conversationId: m.conversationId,
    sender: mine ? 'me' : 'them',
    text: m.text,
    createdAt: m.createdAt.toISOString(),
    status: mine && m.createdAt <= otherReadAt ? 'read' : 'sent',
  };
}

@Injectable()
export class ChatsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: ChatsGateway,
  ) {}

  /** Tenant taps "Message" on a listing: reuse their chat about it, or start one. */
  async start(userId: string, propertyId: string): Promise<ApiChat> {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, status: { in: ['published', 'rented'] } },
      select: { id: true, ownerId: true },
    });
    if (!property) throw new NotFoundException('This listing is no longer available.');
    if (property.ownerId === userId) throw new BadRequestException('This is your own listing.');

    const chat = await this.prisma.conversation.upsert({
      where: { propertyId_tenantId: { propertyId, tenantId: userId } },
      create: { propertyId, tenantId: userId, ownerId: property.ownerId },
      update: {},
      include: SUMMARY_INCLUDE,
    });
    return (await this.withUnread([chat], userId))[0];
  }

  /** Messages tab: my chats (as tenant or owner) that have at least one message, newest first. */
  async list(userId: string): Promise<ApiChat[]> {
    const chats = await this.prisma.conversation.findMany({
      where: { OR: [{ tenantId: userId }, { ownerId: userId }], messages: { some: {} } },
      include: SUMMARY_INCLUDE,
      orderBy: { lastMessageAt: 'desc' },
    });
    return this.withUnread(chats, userId);
  }

  async findOne(userId: string, id: string): Promise<ApiChat> {
    const chat = await this.prisma.conversation.findFirst({
      where: { id, OR: [{ tenantId: userId }, { ownerId: userId }] },
      include: SUMMARY_INCLUDE,
    });
    if (!chat) throw new NotFoundException('Chat not found.');
    return (await this.withUnread([chat], userId))[0];
  }

  /** Badge on the Messages tab: unread messages in all my chats. */
  async unreadCount(userId: string): Promise<{ count: number }> {
    const chats = await this.prisma.conversation.findMany({
      where: { OR: [{ tenantId: userId }, { ownerId: userId }] },
    });
    if (!chats.length) return { count: 0 };
    const count = await this.prisma.message.count({ where: this.unreadWhere(chats, userId) });
    return { count };
  }

  /** Oldest first. Pass `before` to load the previous page. */
  async messages(userId: string, id: string, before?: string): Promise<ApiMessage[]> {
    const chat = await this.member(userId, id);
    const rows = await this.prisma.message.findMany({
      where: { conversationId: id, createdAt: before ? { lt: new Date(before) } : undefined },
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
    });
    const readAt = otherLastRead(chat, userId);
    return rows.reverse().map((m) => toApiMessage(m, userId, readAt));
  }

  async send(userId: string, id: string, text: string): Promise<ApiMessage> {
    const chat = await this.member(userId, id);
    const now = new Date();
    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({ data: { conversationId: id, senderId: userId, text, createdAt: now } }),
      this.prisma.conversation.update({
        where: { id },
        // Sending also means I've read everything before it.
        data: { lastMessageAt: now, ...(myRole(chat, userId) === 'tenant' ? { tenantLastReadAt: now } : { ownerLastReadAt: now }) },
      }),
    ]);

    const otherId = myRole(chat, userId) === 'tenant' ? chat.ownerId : chat.tenantId;
    this.gateway.toUser(otherId, 'chat:message', toApiMessage(message, otherId, EPOCH));
    const mine = toApiMessage(message, userId, otherLastRead(chat, userId));
    this.gateway.toUser(userId, 'chat:message', mine); // my other devices
    return mine;
  }

  /** I opened the chat: everything so far is read. Tells the other person (blue ticks). */
  async markRead(userId: string, id: string): Promise<void> {
    const chat = await this.member(userId, id);
    const now = new Date();
    const tenant = myRole(chat, userId) === 'tenant';
    await this.prisma.conversation.update({
      where: { id },
      data: tenant ? { tenantLastReadAt: now } : { ownerLastReadAt: now },
    });
    const otherId = tenant ? chat.ownerId : chat.tenantId;
    this.gateway.toUser(otherId, 'chat:read', { conversationId: id, readAt: now.toISOString() });
    this.gateway.toUser(userId, 'chat:read-by-me', { conversationId: id });
  }

  private async member(userId: string, id: string): Promise<Conversation> {
    const chat = await this.prisma.conversation.findFirst({
      where: { id, OR: [{ tenantId: userId }, { ownerId: userId }] },
    });
    if (!chat) throw new NotFoundException('Chat not found.');
    return chat;
  }

  /** Messages from the other person that came after I last read the chat. */
  private unreadWhere(chats: Conversation[], userId: string): Prisma.MessageWhereInput {
    return {
      senderId: { not: userId },
      OR: chats.map((c) => ({ conversationId: c.id, createdAt: { gt: myLastRead(c, userId) } })),
    };
  }

  private async withUnread(chats: ConversationWithSummary[], userId: string): Promise<ApiChat[]> {
    const counts = chats.length
      ? await this.prisma.message.groupBy({
          by: ['conversationId'],
          where: this.unreadWhere(chats, userId),
          _count: { _all: true },
        })
      : [];

    return chats.map((c) => {
      const role = myRole(c, userId);
      const other = role === 'tenant' ? c.owner : c.tenant;
      const last = c.messages[0];
      return {
        id: c.id,
        myRole: role,
        property: {
          id: c.property.id,
          title: c.property.title,
          areaLabel: c.property.areaLabel,
          monthlyRent: c.property.monthlyRent,
          status: c.property.status,
          image: c.property.images[0]?.url ?? null,
        },
        other: {
          id: other.id,
          name: other.fullName,
          phone: other.phone,
          isVerified: other.identityVerified,
          avatarUrl: other.avatarUrl,
          role: role === 'tenant' ? 'owner' : 'tenant',
        },
        lastMessage: last
          ? {
              text: last.text,
              mine: last.senderId === userId,
              createdAt: last.createdAt.toISOString(),
              read: last.senderId === userId && last.createdAt <= otherLastRead(c, userId),
            }
          : null,
        unreadCount: counts.find((x) => x.conversationId === c.id)?._count._all ?? 0,
      };
    });
  }
}