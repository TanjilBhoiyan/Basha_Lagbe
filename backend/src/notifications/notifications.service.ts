import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Expo, type ExpoPushMessage } from 'expo-server-sdk';

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

/** Android channel created by the app (pop-up with sound). */
const ANDROID_CHANNEL = 'default';

/**
 * Push notifications through Expo's free push service.
 * Phones register their token with POST /notifications/token after login.
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

  /** Sends to every phone of one user. Never throws: a failed notification must not break the caller. */
  sendToUser(userId: string, message: PushMessage): Promise<void> {
    return this.sendToUsers([userId], message);
  }

  /** Sends to every phone of these users (Expo takes up to 100 per request, so we send in chunks). */
  async sendToUsers(userIds: string[], message: PushMessage): Promise<void> {
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
}