import { Injectable } from '@nestjs/common';

import type { Location, Prisma } from '../generated/prisma/client.js';
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

/** How many areas the Home "Popular Areas" row shows. */
const POPULAR_LIMIT = 10;

/**
 * Areas are created from owners' map pins (see PropertiesService), never from a fixed list.
 * Lists only show areas that have at least one published listing.
 */
@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Popular areas: the ones with the most published listings. */
  async popular(): Promise<ApiLocation[]> {
    const all = await this.withListings();
    return all.sort((a, b) => b.listingCount - a.listingCount || a.name.localeCompare(b.name)).slice(0, POPULAR_LIMIT);
  }

  /** Case-insensitive match on area or city name (areas with listings only). */
  async search(query: string): Promise<ApiLocation[]> {
    const q = query.trim();
    if (!q) return [];
    const found = await this.withListings({
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
      ],
    });
    return found.sort((a, b) => b.listingCount - a.listingCount || a.name.localeCompare(b.name)).slice(0, 20);
  }

  /** Specific areas in the given order (the user's "recent" list), even if they have no listings now. */
  async findByIds(ids: string[]): Promise<ApiLocation[]> {
    if (!ids.length) return [];
    const locations = await this.prisma.location.findMany({ where: { id: { in: ids } } });
    const counts = await this.counts(locations.map((l) => l.id));
    return ids
      .map((id) => locations.find((l) => l.id === id))
      .filter((l): l is Location => !!l)
      .map((l) => toApi(l, counts.get(l.id) ?? 0));
  }

  /** Areas (optionally filtered) that have at least one published listing, with their counts. */
  private async withListings(where: Prisma.LocationWhereInput = {}): Promise<ApiLocation[]> {
    const counts = await this.counts();
    if (!counts.size) return [];
    const locations = await this.prisma.location.findMany({ where: { ...where, id: { in: [...counts.keys()] } } });
    return locations.map((l) => toApi(l, counts.get(l.id) ?? 0));
  }

  /** Published listings per area id (only areas that have some). */
  private async counts(ids?: string[]): Promise<Map<string, number>> {
    const rows = await this.prisma.property.groupBy({
      by: ['locationId'],
      where: { status: 'published', ...(ids ? { locationId: { in: ids } } : {}) },
      _count: { _all: true },
    });
    return new Map(rows.map((r) => [r.locationId, r._count._all]));
  }
}

function toApi(l: Location, listingCount: number): ApiLocation {
  return {
    id: l.id,
    name: l.name,
    city: l.city,
    latitude: l.latitude,
    longitude: l.longitude,
    imageUrl: l.imageUrl,
    listingCount,
  };
}