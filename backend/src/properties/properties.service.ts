import { randomUUID } from 'node:crypto';

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { fromApiEnum } from '../common/enums.js';
import { GeocodeService } from '../geocode/geocode.service.js';
import type { Amenity, Facing, Furnishing, Location, Prisma, TenantType } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { distanceKm } from '../common/geo.js';
import { StorageService } from '../storage/storage.service.js';
import {
  type CreatePropertyDto,
  type ListPropertiesQuery,
  type PropertyFieldsDto,
  type UpdatePropertyDto,
} from './properties.dto.js';
import { PROPERTY_INCLUDE, toApiProperty, toOwnerProperty, type ApiProperty, type OwnerProperty } from './property.mapper.js';

const DEFAULT_LIMIT = 20;
const DEFAULT_RADIUS_KM = 5;
/** Safety cap for the "near me" search (candidates inside the box, before the exact distance check). */
const MAX_NEAR_CANDIDATES = 1000;

/** "Mohakhali" + "Dhaka" -> "dhaka-mohakhali" (Bangla-only names get a random id). */
const areaId = (name: string, city: string) =>
  `${city}-${name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `area-${randomUUID().slice(0, 8)}`;

/** API item with how far it is from the searched point (1 decimal, km). */
export type NearbyProperty = ApiProperty & { distanceKm?: number };

/** "Any" when undefined; 4 means "4 or more". */
const countFilter = (n?: number) => (n === undefined ? undefined : n >= 4 ? { gte: 4 } : n);

@Injectable()
export class PropertiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geocode: GeocodeService,
    private readonly storage: StorageService,
  ) {}

  async list(query: ListPropertiesQuery): Promise<{ items: NearbyProperty[]; total: number; page: number; limit: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? DEFAULT_LIMIT;
    const where = this.buildWhere(query);
    const sort = query.sort ?? 'recommended';

    if (query.lat !== undefined && query.lng !== undefined) {
      return this.listNear(where, query.lat, query.lng, query.radiusKm ?? DEFAULT_RADIUS_KM, sort, page, limit);
    }

    const total = await this.prisma.property.count({ where });

    // "Recommended": the chosen area first, then newest. Prisma can't sort by
    // "locationId = X", so we fetch that area's page first, then the rest.
    if (sort === 'recommended' && query.locationId) {
      const inArea = { ...where, locationId: query.locationId };
      const elsewhere = { ...where, NOT: { locationId: query.locationId } };
      const areaCount = await this.prisma.property.count({ where: inArea });
      const skip = (page - 1) * limit;

      const first = skip < areaCount
        ? await this.prisma.property.findMany({
            where: inArea, include: PROPERTY_INCLUDE, orderBy: { createdAt: 'desc' }, skip, take: limit,
          })
        : [];
      const rest = first.length < limit
        ? await this.prisma.property.findMany({
            where: elsewhere,
            include: PROPERTY_INCLUDE,
            orderBy: { createdAt: 'desc' },
            skip: Math.max(0, skip - areaCount),
            take: limit - first.length,
          })
        : [];
      return { items: [...first, ...rest].map(toApiProperty), total, page, limit };
    }

    const orderBy: Prisma.PropertyOrderByWithRelationInput =
      sort === 'price-asc' ? { monthlyRent: 'asc' } : sort === 'price-desc' ? { monthlyRent: 'desc' } : { createdAt: 'desc' };

    const items = await this.prisma.property.findMany({
      where,
      include: PROPERTY_INCLUDE,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items: items.map(toApiProperty), total, page, limit };
  }

  async findOne(id: string): Promise<ApiProperty> {
    const property = await this.prisma.property.findFirst({
      where: { id, status: { in: ['published', 'rented'] } },
      include: PROPERTY_INCLUDE,
    });
    if (!property) throw new NotFoundException('This listing is no longer available.');
    return toApiProperty(property);
  }

  /** Owner: all my listings (any status), newest first. */
  async mine(ownerId: string): Promise<ApiProperty[]> {
    const properties = await this.prisma.property.findMany({
      where: { ownerId },
      include: PROPERTY_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return properties.map(toApiProperty);
  }

  /** Owner: one of my listings with its private address (for the Edit form). */
  async mineOne(ownerId: string, id: string): Promise<OwnerProperty> {
    const property = await this.prisma.property.findFirst({ where: { id, ownerId }, include: PROPERTY_INCLUDE });
    if (!property) throw new NotFoundException('Listing not found.');
    return toOwnerProperty(property);
  }

  /** Owner: post a new listing. It goes live straight away (bad listings can be removed later). */
  async create(ownerId: string, dto: CreatePropertyDto): Promise<ApiProperty> {
    // Every photo must be one we stored (R2 or this server), never an outside link.
    if (dto.images.some((url) => !this.storage.isOurPhoto(url, 'properties'))) {
      throw new BadRequestException('Please upload the photos again.');
    }

    const data = await this.fieldsToData(dto);
    const property = await this.prisma.property.create({
      data: {
        ...data,
        ownerId,
        status: 'published',
        images: { create: dto.images.map((url, sortOrder) => ({ url, sortOrder })) },
      },
      include: PROPERTY_INCLUDE,
    });
    return toApiProperty(property);
  }

  /**
   * Owner: edit my listing. Photos are replaced by the new list (in order);
   * each one must be newly uploaded or already belong to this listing. Status stays the same.
   */
  async update(ownerId: string, id: string, dto: UpdatePropertyDto): Promise<ApiProperty> {
    const existing = await this.prisma.property.findFirst({ where: { id, ownerId }, include: { images: true } });
    if (!existing) throw new NotFoundException('Listing not found.');

    const current = new Set(existing.images.map((i) => i.url));
    if (dto.images.some((url) => !current.has(url) && !this.storage.isOurPhoto(url, 'properties'))) {
      throw new BadRequestException('Please upload the photos again.');
    }

    const data = await this.fieldsToData(dto);
    const [, property] = await this.prisma.$transaction([
      this.prisma.propertyImage.deleteMany({ where: { propertyId: id } }),
      this.prisma.property.update({
        where: { id },
        data: { ...data, images: { create: dto.images.map((url, sortOrder) => ({ url, sortOrder })) } },
        include: PROPERTY_INCLUDE,
      }),
    ]);
    return toApiProperty(property);
  }

  /** Form fields -> database columns (shared by create and update). */
  private async fieldsToData(dto: PropertyFieldsDto) {
    if (dto.floorNumber > dto.totalFloors) {
      throw new BadRequestException('Floor number cannot be higher than total floors.');
    }

    const { tenantTypes, amenities, furnishing, facing, utilityCost, availableFrom, areaName, ...rest } = dto;
    const location = await this.areaFor(areaName, dto.latitude, dto.longitude);

    return {
      ...rest,
      locationId: location.id,
      areaLabel: location.name === location.city ? location.city : `${location.name}, ${location.city}`,
      tenantTypes: tenantTypes.map((t) => fromApiEnum<TenantType>(t)),
      amenities: [...new Set(amenities)].map((a) => fromApiEnum<Amenity>(a)),
      furnishing: fromApiEnum<Furnishing>(furnishing),
      facing: facing ? fromApiEnum<Facing>(facing) : null,
      utilityIncluded: utilityCost === 'included',
      availableFrom: new Date(availableFrom),
    };
  }

  /**
   * The area row for a listing: the owner's area name in the pin's city ("Mohakhali", "Dhaka").
   * Found by name (any letter case), or created on the spot, so areas come only from real listings.
   */
  private async areaFor(areaName: string, lat: number, lng: number): Promise<Location> {
    const sameName = { name: { equals: areaName, mode: 'insensitive' as const } };
    const city = (await this.geocode.reverse(lat, lng))?.city ?? (await this.cityNear(lat, lng));

    const existing = city
      ? await this.prisma.location.findFirst({ where: { ...sameName, city: { equals: city, mode: 'insensitive' } } })
      : await this.prisma.location.findFirst({ where: sameName }); // no city known: same name anywhere
    if (existing) return existing;

    const areaCity = city ?? areaName;
    let id = areaId(areaName, areaCity);
    if (await this.prisma.location.findUnique({ where: { id } })) id = `${id}-${randomUUID().slice(0, 4)}`;
    return this.prisma.location.create({ data: { id, name: areaName, city: areaCity, latitude: lat, longitude: lng } });
  }

  /** Geocoding is down: the city of the closest known area within 30 km, if any. */
  private async cityNear(lat: number, lng: number): Promise<string | undefined> {
    const areas = await this.prisma.location.findMany({ select: { city: true, latitude: true, longitude: true } });
    const near = areas
      .map((a) => ({ city: a.city, km: distanceKm(lat, lng, a.latitude, a.longitude) }))
      .filter((a) => a.km <= 30)
      .sort((a, b) => a.km - b.km)[0];
    return near?.city;
  }

  /** Owner: mark a live listing as rented, or a rented one as available again. */
  async setStatus(ownerId: string, id: string, status: 'published' | 'rented'): Promise<ApiProperty> {
    const property = await this.prisma.property.findFirst({ where: { id, ownerId } });
    if (!property) throw new NotFoundException('Listing not found.');
    const allowed = (property.status === 'published' && status === 'rented') ||
      (property.status === 'rented' && status === 'published');
    if (!allowed) {
      throw new BadRequestException(`A ${property.status} listing can't be changed to ${status}.`);
    }
    const updated = await this.prisma.property.update({
      where: { id },
      data: { status },
      include: PROPERTY_INCLUDE,
    });
    return toApiProperty(updated);
  }

  /** Owner: delete my listing (photos, favorites and visit requests go with it). */
  async remove(ownerId: string, id: string): Promise<void> {
    const { count } = await this.prisma.property.deleteMany({ where: { id, ownerId } });
    if (!count) throw new NotFoundException('Listing not found.');
  }

  /**
   * "Near me": a cheap box around the point first (uses normal column filters),
   * then the exact distance; nearest first unless a price sort is chosen.
   */
  private async listNear(
    where: Prisma.PropertyWhereInput,
    lat: number,
    lng: number,
    radiusKm: number,
    sort: string,
    page: number,
    limit: number,
  ) {
    const latPad = radiusKm / 111; // ~111 km per degree of latitude
    const lngPad = radiusKm / (111 * Math.max(Math.cos((lat * Math.PI) / 180), 0.01));
    const candidates = await this.prisma.property.findMany({
      where: {
        ...where,
        latitude: { gte: lat - latPad, lte: lat + latPad },
        longitude: { gte: lng - lngPad, lte: lng + lngPad },
      },
      include: PROPERTY_INCLUDE,
      take: MAX_NEAR_CANDIDATES,
    });

    const inRange = candidates
      .map((p) => ({ p, km: distanceKm(lat, lng, p.latitude, p.longitude) }))
      .filter((x) => x.km <= radiusKm)
      .sort((a, b) =>
        sort === 'price-asc'
          ? a.p.monthlyRent - b.p.monthlyRent
          : sort === 'price-desc'
            ? b.p.monthlyRent - a.p.monthlyRent
            : sort === 'newest'
              ? b.p.createdAt.getTime() - a.p.createdAt.getTime()
              : a.km - b.km,
      );

    const items = inRange
      .slice((page - 1) * limit, page * limit)
      .map(({ p, km }) => ({ ...toApiProperty(p), distanceKm: Math.round(km * 10) / 10 }));
    return { items, total: inRange.length, page, limit };
  }

  private buildWhere(q: ListPropertiesQuery): Prisma.PropertyWhereInput {
    const text = q.q?.trim();
    return {
      status: 'published',
      type: q.type,
      furnishing: q.furnishing ? fromApiEnum<Furnishing>(q.furnishing) : undefined,
      tenantTypes: q.tenantType ? { has: fromApiEnum<TenantType>(q.tenantType) } : undefined,
      amenities: q.amenities?.length ? { hasEvery: q.amenities.map((a) => fromApiEnum<Amenity>(a)) } : undefined,
      monthlyRent: { gte: q.minRent, lte: q.maxRent },
      bedrooms: countFilter(q.bedrooms),
      bathrooms: countFilter(q.bathrooms),
      availableFrom: q.availableBy ? { lte: new Date(q.availableBy) } : undefined,
      OR: text
        ? [
            { title: { contains: text, mode: 'insensitive' } },
            { areaLabel: { contains: text, mode: 'insensitive' } },
          ]
        : undefined,
    };
  }
}