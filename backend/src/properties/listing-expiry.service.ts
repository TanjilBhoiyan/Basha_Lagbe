import { Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';

import { NotificationsService } from '../notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const TIME_ZONE = 'Asia/Dhaka';

/** A whole number >= 1 from .env, or the default. */
function positiveInt(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 ? n : fallback;
}

/** "12 Nov" in Bangladesh time. */
const shortDate = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: TIME_ZONE });

/**
 * Keeps old listings out of search:
 * - every REMINDER_INTERVAL_DAYS after confirmedAt, asks the owner "Still available?" (up to MAX_REMINDERS times)
 * - LISTING_TTL_DAYS after confirmedAt with no answer, hides the listing (status "expired"; the owner can renew it)
 * Runs once a day (LISTING_JOB_CRON, Bangladesh time). confirmedAt restarts on post, "Still available", renew,
 * and rented -> available.
 * .env (all optional): LISTING_TTL_DAYS=30, REMINDER_INTERVAL_DAYS=7, MAX_REMINDERS=3, LISTING_JOB_CRON="0 10 * * *"
 */
@Injectable()
export class ListingExpiryService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ListingExpiryService.name);
  private readonly ttlDays: number;
  private readonly intervalDays: number;
  private readonly maxReminders: number;
  private readonly cronTime: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly scheduler: SchedulerRegistry,
    config: ConfigService,
  ) {
    this.ttlDays = positiveInt(config.get<string>('LISTING_TTL_DAYS'), 30);
    this.intervalDays = positiveInt(config.get<string>('REMINDER_INTERVAL_DAYS'), 7);
    this.maxReminders = positiveInt(config.get<string>('MAX_REMINDERS'), 3);
    this.cronTime = config.get<string>('LISTING_JOB_CRON') || '0 10 * * *';
  }

  onApplicationBootstrap() {
    const job = CronJob.from({
      cronTime: this.cronTime,
      onTick: () => this.run(),
      timeZone: TIME_ZONE,
      waitForCompletion: true, // never two runs at the same time
      start: true,
    });
    this.scheduler.addCronJob('listing-expiry', job);
    this.logger.log(
      `Listing expiry: "${this.cronTime}" (${TIME_ZONE}), reminder every ${this.intervalDays} days ` +
        `(max ${this.maxReminders}), hidden after ${this.ttlDays} days`,
    );
  }

  /** One daily run. Hiding goes first, so a listing never gets a reminder on the day it is hidden. */
  async run(): Promise<void> {
    try {
      const hidden = await this.hideUnconfirmed();
      const reminded = await this.sendReminders();
      if (hidden || reminded) this.logger.log(`Listing expiry: ${hidden} hidden, ${reminded} reminders sent`);
    } catch (e) {
      this.logger.error(`Listing expiry failed: ${(e as Error).message}`);
    }
  }

  /** The day a listing confirmed at `confirmedAt` gets hidden, "2026-11-28" (Bangladesh date). */
  hidesOn(confirmedAt: Date): string {
    return new Date(confirmedAt.getTime() + this.ttlDays * DAY_MS).toLocaleDateString('en-CA', { timeZone: TIME_ZONE });
  }

  /** Published listings not confirmed for LISTING_TTL_DAYS -> expired. Returns how many. */
  private async hideUnconfirmed(): Promise<number> {
    const due = await this.prisma.property.findMany({
      where: { status: 'published', confirmedAt: { lte: this.daysAgo(this.ttlDays) } },
      select: { id: true, ownerId: true, title: true },
    });
    if (!due.length) return 0;

    await this.prisma.property.updateMany({
      where: { id: { in: due.map((p) => p.id) }, status: 'published' },
      data: { status: 'expired' },
    });
    for (const p of due) {
      await this.notifications.sendToUser(p.ownerId, {
        title: 'Your listing is hidden',
        body: `"${p.title}" was not confirmed for ${this.ttlDays} days, so tenants can't see it now. Tap to renew it.`,
        data: { screen: 'my-listings', propertyId: p.id },
      });
    }
    return due.length;
  }

  /**
   * Reminder n (1, 2, 3...) is due n × REMINDER_INTERVAL_DAYS after confirmedAt.
   * remindersSent says which ones already went out. Returns how many were sent now.
   */
  private async sendReminders(): Promise<number> {
    let sent = 0;
    for (let already = 0; already < this.maxReminders; already++) {
      const dueAfterDays = this.intervalDays * (already + 1);
      if (dueAfterDays >= this.ttlDays) break; // it would be hidden first anyway

      const due = await this.prisma.property.findMany({
        where: { status: 'published', remindersSent: already, confirmedAt: { lte: this.daysAgo(dueAfterDays) } },
        select: { id: true, ownerId: true, title: true, areaLabel: true, confirmedAt: true },
      });

      for (const p of due) {
        // Count it first (only if nobody else did), so a crash never sends the same reminder twice.
        const { count } = await this.prisma.property.updateMany({
          where: { id: p.id, status: 'published', remindersSent: already },
          data: { remindersSent: already + 1 },
        });
        if (!count) continue;

        const hideOn = shortDate(new Date(p.confirmedAt.getTime() + this.ttlDays * DAY_MS));
        await this.notifications.sendToUser(p.ownerId, {
          title: 'Is it still available?',
          body: `Is "${p.title}" in ${p.areaLabel} still available? Please confirm, or it will be hidden on ${hideOn}.`,
          data: { screen: 'listing-reminder', propertyId: p.id },
          categoryId: 'listing-reminder',
        });
        sent++;
      }
    }
    return sent;
  }

  private daysAgo(days: number) {
    return new Date(Date.now() - days * DAY_MS);
  }
}