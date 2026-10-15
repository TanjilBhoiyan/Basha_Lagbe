import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { fromApiEnum } from '../common/enums.js';
import type { Amenity, Facing, Furnishing, Prisma, TenantType } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  UPLOADED_IMAGE,
  type CreatePropertyDto,
  type ListPropertiesQuery,
  type PropertyFieldsDto,
  type UpdatePropertyDto,
} from './properties.dto.js';
import { PROPERTY_INCLUDE, toApiProperty, toOwnerProperty, type ApiProperty, type OwnerProperty } from './property.mapper.js';

const DEFAULT_LIMIT = 20;

/** "Any" when undefined; 4 means "4 or more". */
const countFilter = (n?: number) => (n === undefined ? undefined : n >= 4 ? { gte: 4 } : n);

@Injectable()
export class PropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListPropertiesQuery): Promise<{ items: ApiProperty[]; total: number; page: number; limit: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? DEFAULT_LIMIT;
    const where = this.buildWhere(query);
    const sort = query.sort ?? 'recommended';

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
    if (dto.images.some((url) => !current.has(url) && !UPLOADED_IMAGE.test(url))) {
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
    const location = await this.prisma.location.findUnique({ where: { id: dto.locationId } });
    if (!location) throw new BadRequestException('Please select a valid area.');
    if (dto.floorNumber > dto.totalFloors) {
      throw new BadRequestException('Floor number cannot be higher than total floors.');
    }

    const { tenantTypes, amenities, furnishing, facing, utilityCost, availableFrom, ...rest } = dto;
    return {
      ...rest,
      areaLabel: location.name === location.city ? location.city : `${location.name}, ${location.city}`,
      latitude: location.latitude,
      longitude: location.longitude,
      tenantTypes: tenantTypes.map((t) => fromApiEnum<TenantType>(t)),
      amenities: [...new Set(amenities)].map((a) => fromApiEnum<Amenity>(a)),
      furnishing: fromApiEnum<Furnishing>(furnishing),
      facing: facing ? fromApiEnum<Facing>(facing) : null,
      utilityIncluded: utilityCost === 'included',
      availableFrom: new Date(availableFrom),
    };
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