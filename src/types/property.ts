import type { ImageSourcePropType } from 'react-native';

export type PropertyType = 'apartment' | 'room' | 'house' | 'sublet' | 'office' | 'shop' | 'mess';

export type TenantType = 'family' | 'bachelor-male' | 'bachelor-female' | 'student' | 'professional';

export type Furnishing = 'furnished' | 'semi-furnished' | 'unfurnished';

export type Amenity =
  | 'wifi'
  | 'parking'
  | 'ac'
  | 'generator'
  | 'lift'
  | 'security'
  | 'gas'
  | 'water'
  | 'balcony';

export type Property = {
  id: string;
  title: string;
  type: PropertyType;
  locationId: string;
  /** Public address only (area + city). The exact address stays private. */
  areaLabel: string;
  monthlyRent: number;
  bedrooms: number;
  bathrooms: number;
  sizeSqft: number;
  tenantTypes: TenantType[];
  furnishing: Furnishing;
  amenities: Amenity[];
  /** ISO date (YYYY-MM-DD) the property can be moved into. */
  availableFrom: string;
  images: ImageSourcePropType[];
  isVerified: boolean;
  owner: { name: string; phone: string };
};