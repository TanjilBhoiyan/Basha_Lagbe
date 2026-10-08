import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import type { Visit } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateVisitDto } from './visits.dto.js';

const VISIT_DURATION_MS = 60 * 60 * 1000;
const MIN_NOTICE_MS = 60 * 60 * 1000; // book at least 1 hour ahead (same as the app)
const MAX_DAYS_AHEAD = 30;

/** Visit dates/times are Bangladesh local time (UTC+6, no daylight saving). */
const slotStart = (date: string, time: string) => new Date(`${date}T${time}:00+06:00`);
const dateOnly = (d: Date) => d.toISOString().slice(0, 10);

/** Same shape as the app's VisitRequest type. */
export function toApiVisit(v: Visit) {
  return {
    id: v.id,
    propertyId: v.propertyId,
    date: dateOnly(v.date),
    time: v.time,
    message: v.message,
    status: v.status,
    createdAt: v.createdAt.toISOString(),
  };
}

/** Pending/confirmed and the slot hasn't passed yet. */
function isActive(v: Visit, now = Date.now()) {
  const start = slotStart(dateOnly(v.date), v.time).getTime();
  if (v.status === 'pending') return start > now;
  if (v.status === 'confirmed') return start + VISIT_DURATION_MS > now;
  return false;
}

@Injectable()
export class VisitsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Tenant: my visit requests, newest first. */
  async mine(tenantId: string, propertyId?: string) {
    const visits = await this.prisma.visit.findMany({
      where: { tenantId, propertyId },
      orderBy: { createdAt: 'desc' },
    });
    return visits.map(toApiVisit);
  }

  /** Tenant: request a visit. One open request per property — a new one replaces a pending one. */
  async request(tenantId: string, dto: CreateVisitDto) {
    const property = await this.prisma.property.findFirst({
      where: { id: dto.propertyId, status: 'published' },
      select: { ownerId: true },
    });
    if (!property) throw new NotFoundException('This listing is no longer available.');
    if (property.ownerId === tenantId) {
      throw new BadRequestException("You can't request a visit to your own property.");
    }

    const start = slotStart(dto.date, dto.time).getTime();
    if (Number.isNaN(start) || start - Date.now() < MIN_NOTICE_MS) {
      throw new BadRequestException('This time is no longer available. Please pick another slot.');
    }
    if (start - Date.now() > MAX_DAYS_AHEAD * 24 * 60 * 60 * 1000) {
      throw new BadRequestException(`Please pick a date within the next ${MAX_DAYS_AHEAD} days.`);
    }

    const open = (
      await this.prisma.visit.findMany({
        where: { tenantId, propertyId: dto.propertyId, status: { in: ['pending', 'confirmed'] } },
      })
    ).find((v) => isActive(v));

    if (open?.status === 'confirmed') {
      throw new ConflictException('Your visit is already confirmed by the owner.');
    }

    const data = {
      date: new Date(`${dto.date}T00:00:00Z`),
      time: dto.time,
      message: dto.message ?? '',
      status: 'pending' as const,
    };
    const visit = open
      ? await this.prisma.visit.update({ where: { id: open.id }, data })
      : await this.prisma.visit.create({ data: { ...data, tenantId, propertyId: dto.propertyId } });
    // TODO: notify the owner (push notification) once notifications are added.
    return toApiVisit(visit);
  }

  /** Tenant: cancel my own pending/confirmed request. */
  async cancel(tenantId: string, visitId: string) {
    const visit = await this.prisma.visit.findFirst({ where: { id: visitId, tenantId } });
    if (!visit) throw new NotFoundException('Visit request not found.');
    if (visit.status !== 'pending' && visit.status !== 'confirmed') {
      throw new BadRequestException('This request can no longer be cancelled.');
    }
    const updated = await this.prisma.visit.update({ where: { id: visitId }, data: { status: 'cancelled' } });
    return toApiVisit(updated);
  }

  /** Owner: requests for my properties, soonest first, with who asked. */
  async incoming(ownerId: string) {
    const visits = await this.prisma.visit.findMany({
      where: { property: { ownerId } },
      include: {
        property: { select: { title: true, areaLabel: true } },
        tenant: { select: { fullName: true, phone: true } },
      },
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    });
    return visits.map((v) => ({
      ...toApiVisit(v),
      property: v.property,
      tenant: { name: v.tenant.fullName, phone: v.tenant.phone },
    }));
  }

  /** Owner: confirm or decline a pending request. */
  async respond(ownerId: string, visitId: string, decision: 'confirm' | 'decline') {
    const visit = await this.prisma.visit.findFirst({ where: { id: visitId, property: { ownerId } } });
    if (!visit) throw new NotFoundException('Visit request not found.');
    if (visit.status !== 'pending') {
      throw new BadRequestException(`This request is already ${visit.status}.`);
    }
    if (!isActive(visit)) throw new BadRequestException('This visit time has already passed.');

    const updated = await this.prisma.visit.update({
      where: { id: visitId },
      data: { status: decision === 'confirm' ? 'confirmed' : 'declined' },
    });
    // TODO: notify the tenant (push notification).
    return toApiVisit(updated);
  }
}