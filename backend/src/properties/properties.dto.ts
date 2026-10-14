import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
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

/** POST /properties — what the Add Property form sends. */
export class CreatePropertyDto {
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

  /** Area id from GET /locations, e.g. "dhaka-mirpur" */
  @IsString()
  @MaxLength(60)
  locationId: string;

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

  @IsInt()
  @Min(50)
  @Max(100000)
  sizeSqft: number;

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

  /** URLs returned by POST /uploads/property-image, first one is the cover */
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @Matches(/^\/static\/uploads\/properties\/[0-9a-f-]{36}\.(jpg|png|webp)$/, {
    each: true,
    message: 'Please upload the photos again.',
  })
  images: string[];
}