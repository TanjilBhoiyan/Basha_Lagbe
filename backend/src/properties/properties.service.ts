import { Injectable, NotFoundException } from '@nestjs/common';

import { fromApiEnum } from '../common/enums.js';
import type { Amenity, Furnishing, Prisma, TenantType } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { ListPropertiesQuery } from './properties.dto.js';
import { PROPERTY_INCLUDE, toApiProperty, type ApiProperty } from './property.mapper.js';

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