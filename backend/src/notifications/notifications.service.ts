import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { Expo, type ExpoPushMessage } from 'expo-server-sdk';

import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

/** What a notification says, and what the app should open when it is tapped. */
export type PushMessage = {
  title: string;
  body: string;
  /** Read by the app on tap, e.g. { screen: 'visits' } */
  data?: Record<string, unknown>;
  /** Action buttons registered in the app, e.g. "listing-reminder" (Still available / Rented) */
  categoryId?: string;
};

/** One row of the in-app notification list. */
export type ApiNotification = {
  id: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read: boolean;
  createdAt: string;
};

/** Android channel created by the app (pop-up with sound). */
const ANDROID_CHANNEL = 'default';
const PAGE_SIZE = 50;
/** Older notifications are deleted by the daily clean-up. */
const KEEP_DAYS = 90;

/**
 * Notifications: every message is saved to the in-app list (bell icon) and sent as a push
 * through Expo's free push service. Phones register their token with POST /notifications/token.
 * .env (optional): EXPO_ACCESS_TOKEN, only needed if "enhanced push security" is turned on at expo.dev.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly expo: Expo;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    const accessToken = config.get<string>('EXPO_ACCESS_TOKEN');
    this.expo = new Expo(accessToken ? { accessToken } : {});
  }

  // ─── Push tokens ────────────────────────────────────────

  /** Remembers this phone for the user. A phone that changes account moves to the new user. */
  async saveToken(userId: string, token: string): Promise<void> {
    await this.prisma.pushToken.upsert({
      where: { token },
      create: { token, userId },
      update: { userId },
    });
  }

  /** Logout: this phone stops getting the user's notifications. */
  async removeToken(userId: string, token: string): Promise<void> {
    await this.prisma.pushToken.deleteMany({ where: { token, userId } });
  }

  // ─── Sending ────────────────────────────────────────────

  /** Saves to one user's list and pushes to their phones. Never throws: it must not break the caller. */
  sendToUser(userId: string, message: PushMessage): Promise<void> {
    return this.sendToUsers([userId], message);
  }

  /** Saves to each user's list, then pushes (Expo takes up to 100 per request, so we send in chunks). */
  async sendToUsers(userIds: string[], message: PushMessage): Promise<void> {
    try {
      await this.prisma.notification.createMany({
        data: userIds.map((userId) => ({
          userId,
          title: message.title,
          body: message.body,
          data: (message.data ?? {}) as Prisma.InputJsonValue,
        })),
      });
    } catch (e) {
      this.logger.warn(`Notification not saved: ${(e as Error).message}`);
    }
    await this.push(userIds, message);
  }

  private async push(userIds: string[], message: PushMessage): Promise<void> {
    try {
      const rows = await this.prisma.pushToken.findMany({
        where: { userId: { in: userIds } },
        select: { token: true },
      });
      const tokens = rows.map((r) => r.token).filter((t) => Expo.isExpoPushToken(t));
      if (!tokens.length) return;

      const messages: ExpoPushMessage[] = tokens.map((to) => ({
        to,
        title: message.title,
        body: message.body,
        data: message.data,
        categoryId: message.categoryId,
        channelId: ANDROID_CHANNEL,
        sound: 'default',
        priority: 'high',
      }));

      const deadTokens: string[] = [];
      for (const chunk of this.expo.chunkPushNotifications(messages)) {
        const tickets = await this.expo.sendPushNotificationsAsync(chunk);
        tickets.forEach((ticket, i) => {
          if (ticket.status !== 'error') return;
          // App uninstalled or notifications turned off: this token will never work again.
          if (ticket.details?.error === 'DeviceNotRegistered') deadTokens.push(String(chunk[i]?.to));
          else this.logger.warn(`Push not sent: ${ticket.message}`);
        });
      }

      if (deadTokens.length) {
        await this.prisma.pushToken.deleteMany({ where: { token: { in: deadTokens } } });
      }
    } catch (e) {
      this.logger.warn(`Push failed: ${(e as Error).message}`);
    }
  }

  // ─── In-app list ────────────────────────────────────────

  /** My notifications, newest first, PAGE_SIZE at a time. `before` = the last id of the previous page. */
  async list(userId: string, before?: string): Promise<{ items: ApiNotification[]; nextCursor: string | null }> {
    const rows = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: PAGE_SIZE + 1,
      ...(before ? { cursor: { id: before }, skip: 1 } : {}),
    });
    const page = rows.slice(0, PAGE_SIZE);
    return {
      items: page.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        data: (n.data ?? {}) as Record<string, unknown>,
        read: n.readAt !== null,
        createdAt: n.createdAt.toISOString(),
      })),
      nextCursor: rows.length > PAGE_SIZE ? (page.at(-1)?.id ?? null) : null,
    };
  }

  /** How many I haven't seen yet (the red dot on the bell). */
  async unreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.prisma.notification.count({ where: { userId, readAt: null } });
    return { count };
  }

  async markRead(userId: string, id: string): Promise<void> {
    await this.prisma.notification.updateMany({ where: { id, userId, readAt: null }, data: { readAt: new Date() } });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
  }

  /** Every night: delete notifications older than KEEP_DAYS so the table stays small. */
  @Cron('30 3 * * *', { timeZone: 'Asia/Dhaka' })
  async deleteOld(): Promise<void> {
    try {
      const cutoff = new Date(Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000);
      const { count } = await this.prisma.notification.deleteMany({ where: { createdAt: { lt: cutoff } } });
      if (count) this.logger.log(`Deleted ${count} notifications older than ${KEEP_DAYS} days`);
    } catch (e) {
      this.logger.warn(`Notification clean-up failed: ${(e as Error).message}`);
    }
  }
}