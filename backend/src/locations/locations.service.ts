import { Injectable } from '@nestjs/common';

import type { Location } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

/** Same shape as the app's `Location` type. */
export type ApiLocation = {
  id: string;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
  imageUrl: string | null;
  /** Published listings in this area. */
  listingCount: number;
};

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Popular areas in display order. */
  async popular(): Promise<ApiLocation[]> {
    const locations = await this.prisma.location.findMany({
      where: { popularRank: { not: null } },
      orderBy: { popularRank: 'asc' },
    });
    return this.withCounts(locations);
  }

  /** Case-insensitive match on area or city name. */
  async search(query: string): Promise<ApiLocation[]> {
    const q = query.trim();
    if (!q) return [];
    const locations = await this.prisma.location.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { city: { contains: q, mode: 'insensitive' } },
        ],
      },
      orderBy: [{ popularRank: { sort: 'asc', nulls: 'last' } }, { name: 'asc' }],
      take: 20,
    });
    return this.withCounts(locations);
  }

  async findByIds(ids: string[]): Promise<ApiLocation[]> {
    if (!ids.length) return [];
    const locations = await this.prisma.location.findMany({ where: { id: { in: ids } } });
    const sorted = ids.map((id) => locations.find((l) => l.id === id)).filter((l): l is Location => !!l);
    return this.withCounts(sorted);
  }

  private async withCounts(locations: Location[]): Promise<ApiLocation[]> {
    const counts = await this.prisma.property.groupBy({
      by: ['locationId'],
      where: { status: 'published', locationId: { in: locations.map((l) => l.id) } },
      _count: { _all: true },
    });
    return locations.map((l) => ({
      id: l.id,
      name: l.name,
      city: l.city,
      latitude: l.latitude,
      longitude: l.longitude,
      imageUrl: l.imageUrl,
      listingCount: counts.find((c) => c.locationId === l.id)?._count._all ?? 0,
    }));
  }
}