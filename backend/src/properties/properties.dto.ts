import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/** Query string for GET /properties — every filter is optional ("any"). */

const PROPERTY_TYPES = ['apartment', 'room', 'house', 'sublet', 'office', 'shop', 'mess'] as const;
const TENANT_TYPES = ['family', 'bachelor-male', 'bachelor-female', 'student', 'professional'] as const;
const FURNISHINGS = ['furnished', 'semi-furnished', 'unfurnished'] as const;
export const AMENITIES = [
  'wifi', 'parking', 'ac', 'generator', 'lift', 'security',
  'cctv', 'gas', 'water', 'balcony', 'fire-safety',
] as const;
export const FACINGS = [
  'north', 'south', 'east', 'west', 'north-east', 'north-west', 'south-east', 'south-west',
] as const;
const SORTS = ['recommended', 'price-asc', 'price-desc', 'newest'] as const;

export type PropertySort = (typeof SORTS)[number];

export class ListPropertiesQuery {
  /** Free text: title or area, e.g. "mirpur" */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @IsIn(PROPERTY_TYPES)
  type?: (typeof PROPERTY_TYPES)[number];

  @IsOptional()
  @IsIn(TENANT_TYPES)
  tenantType?: (typeof TENANT_TYPES)[number];

  @IsOptional()
  @IsIn(FURNISHINGS)
  furnishing?: (typeof FURNISHINGS)[number];

  /** Comma separated, property must have ALL of them: "wifi,lift" */
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',').filter(Boolean) : value))
  @IsIn(AMENITIES, { each: true })
  amenities?: (typeof AMENITIES)[number][];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minRent?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxRent?: number;

  /** 4 means "4 or more" */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10)
  bedrooms?: number;

  /** 4 means "4 or more" */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10)
  bathrooms?: number;

  /** "YYYY-MM-DD": available on or before this date */
  @IsOptional()
  @IsDateString()
  availableBy?: string;

  /** Listings in this area come first (sort=recommended) */
  @IsOptional()
  @IsString()
  @MaxLength(60)
  locationId?: string;

  /** "Near me": centre of the search (both lat and lng needed). Listings are then sorted by distance. */
  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  lat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  lng?: number;

  /** How far from lat/lng, in km (default 5). */
  @IsOptional()
  @Type(() => Number)
  @Min(0.5)
  @Max(50)
  radiusKm?: number;

  @IsOptional()
  @IsIn(SORTS)
  sort?: PropertySort;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class UpdateListingStatusDto {
  /** rented = hide from search; published = available again */
  @IsIn(['published', 'rented'])
  status: 'published' | 'rented';
}

/** Every field of the Add/Edit Property form except photos. */
export class PropertyFieldsDto {
  @IsString()
  @MinLength(10)
  @MaxLength(100)
  title: string;

  @IsIn(PROPERTY_TYPES)
  type: (typeof PROPERTY_TYPES)[number];

  @IsArray()
  @ArrayMinSize(1)
  @IsIn(TENANT_TYPES, { each: true })
  tenantTypes: (typeof TENANT_TYPES)[number][];

  /** Exact spot of the home, pinned by the owner on the map. Tenants only ever see it rounded (~200 m). */
  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;

  /**
   * Area name, filled from the pin and editable by the owner, e.g. "Mohakhali".
   * The server finds this area (or creates it) in the pin's city.
   */
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  areaName: string;

  /** Exact address — saved but never shown publicly */
  @IsString()
  @MinLength(15)
  @MaxLength(200)
  address: string;

  @IsInt()
  @Min(1000)
  @Max(1000000)
  monthlyRent: number;

  @IsBoolean()
  negotiable: boolean;

  @IsInt()
  @Min(0)
  @Max(12)
  advanceMonths: number;

  @IsInt()
  @Min(0)
  @Max(100000)
  serviceCharge: number;

  @IsIn(['included', 'separate'])
  utilityCost: 'included' | 'separate';

  @IsInt()
  @Min(0)
  @Max(36)
  minStayMonths: number;

  @IsInt()
  @Min(0)
  @Max(10)
  bedrooms: number;

  @IsInt()
  @Min(0)
  @Max(10)
  bathrooms: number;

  /** Optional: many owners don't know it. */
  @IsOptional()
  @IsInt()
  @Min(50)
  @Max(100000)
  sizeSqft?: number

  /** 0 = ground floor */
  @IsInt()
  @Min(0)
  @Max(100)
  floorNumber: number;

  @IsInt()
  @Min(1)
  @Max(100)
  totalFloors: number;

  @IsOptional()
  @IsIn(FACINGS)
  facing?: (typeof FACINGS)[number];

  @IsIn(FURNISHINGS)
  furnishing: (typeof FURNISHINGS)[number];

  @IsArray()
  @IsIn(AMENITIES, { each: true })
  amenities: (typeof AMENITIES)[number][];

  /** "YYYY-MM-DD" */
  @IsDateString({ strict: true })
  availableFrom: string;

  @IsString()
  @MinLength(30)
  @MaxLength(1000)
  description: string;
}

/** A photo URL returned by POST /uploads/property-image. */
export const UPLOADED_IMAGE = /^\/static\/uploads\/properties\/[0-9a-f-]{36}\.(jpg|png|webp)$/;

/** POST /properties — what the Add Property form sends. */
export class CreatePropertyDto extends PropertyFieldsDto {
  /** URLs returned by POST /uploads/property-image, first one is the cover */
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @Matches(UPLOADED_IMAGE, { each: true, message: 'Please upload the photos again.' })
  images: string[];
}

/** PUT /properties/:id — same form; photos may also be the listing's existing ones (checked in the service). */
export class UpdatePropertyDto extends PropertyFieldsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(300, { each: true })
  images: string[];
}