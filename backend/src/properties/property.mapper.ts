import { toApiEnum } from '../common/enums.js';
import type { Prisma } from '../generated/prisma/client.js';

/** Everything we load for a property card or details page. */
export const PROPERTY_INCLUDE = {
  images: { orderBy: { sortOrder: 'asc' } },
  owner: { select: { fullName: true, phone: true, identityVerified: true, avatarUrl: true, createdAt: true } },
} satisfies Prisma.PropertyInclude;

export type PropertyWithRelations = Prisma.PropertyGetPayload<{ include: typeof PROPERTY_INCLUDE }>;

/** Same shape as the app's `Property` type (lowercase-with-dashes values, dates as strings). */
export function toApiProperty(p: PropertyWithRelations) {
  const joined = p.owner.createdAt.toISOString();
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    type: p.type,
    status: p.status,
    locationId: p.locationId,
    areaLabel: p.areaLabel,
    latitude: p.latitude,
    longitude: p.longitude,
    monthlyRent: p.monthlyRent,
    negotiable: p.negotiable,
    advanceMonths: p.advanceMonths,
    serviceCharge: p.serviceCharge,
    securityDepositMonths: p.securityDepositMonths,
    utilityCost: p.utilityIncluded ? 'included' : 'separate',
    minStayMonths: p.minStayMonths,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    sizeSqft: p.sizeSqft,
    floorNumber: p.floorNumber,
    totalFloors: p.totalFloors,
    facing: p.facing ? toApiEnum(p.facing) : undefined,
    tenantTypes: p.tenantTypes.map(toApiEnum),
    furnishing: toApiEnum(p.furnishing),
    amenities: p.amenities.map(toApiEnum),
    availableFrom: p.availableFrom.toISOString().slice(0, 10),
    images: p.images.map((i) => i.url),
    videoUrl: p.videoUrl ?? undefined,
    isVerified: p.isVerified,
    owner: {
      name: p.owner.fullName,
      phone: p.owner.phone,
      isVerified: p.owner.identityVerified,
      avatarUrl: p.owner.avatarUrl ?? undefined,
      memberSince: joined.slice(0, 7),
    },
    createdAt: p.createdAt.toISOString(),
  };
}

export type ApiProperty = ReturnType<typeof toApiProperty>;

/** The owner's own view of a listing: public fields + status + the private address. */
export function toOwnerProperty(p: PropertyWithRelations) {
  return { ...toApiProperty(p), address: p.address ?? '' };
}

export type OwnerProperty = ReturnType<typeof toOwnerProperty>;