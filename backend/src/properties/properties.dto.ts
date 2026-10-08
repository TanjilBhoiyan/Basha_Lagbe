import { Transform, Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

/** Query string for GET /properties — every filter is optional ("any"). */

const PROPERTY_TYPES = ['apartment', 'room', 'house', 'sublet', 'office', 'shop', 'mess'] as const;
const TENANT_TYPES = ['family', 'bachelor-male', 'bachelor-female', 'student', 'professional'] as const;
const FURNISHINGS = ['furnished', 'semi-furnished', 'unfurnished'] as const;
export const AMENITIES = [
  'wifi', 'parking', 'ac', 'generator', 'lift', 'security',
  'cctv', 'gas', 'water', 'balcony', 'fire-safety',
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