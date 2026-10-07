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
  | 'cctv'
  | 'gas'
  | 'water'
  | 'balcony'
  | 'fire-safety';

export type PropertyOwner = {
  name: string;
  phone: string;
  isVerified: boolean;
  /** "YYYY-MM" the owner joined. */
  memberSince: string;
};

export type Property = {
  id: string;
  title: string;
  type: PropertyType;
  locationId: string;
  /** Public address only (area + city). The exact address stays private. */
  areaLabel: string;
  /**
   * Approximate map position (area level), NOT the exact house.
   * The exact address is only shared after the owner approves.
   */
  latitude: number;
  longitude: number;
  monthlyRent: number;
  negotiable: boolean;
  /** Advance rent the owner asks for, in months (common in Bangladesh). */
  advanceMonths: number;
  /** Monthly service charge in BDT (0 = included / none). */
  serviceCharge: number;
    /** Refundable security deposit, in months of rent (0 = none). */
  securityDepositMonths: number;
  /** Whether electricity/gas/water bills are paid separately by the tenant. */
  utilityCost: 'included' | 'separate';
  /** Minimum rental period in months. */
  minStayMonths: number;
  bedrooms: number;
  bathrooms: number;
  sizeSqft: number;
  floorNumber: number;
  totalFloors: number;
  description: string;
  tenantTypes: TenantType[];
  furnishing: Furnishing;
  amenities: Amenity[];
  /** ISO date (YYYY-MM-DD) the property can be moved into. */
  availableFrom: string;
  images: ImageSourcePropType[];
    /** Optional property tour (uploaded video or YouTube link). */
  videoUrl?: string;
  isVerified: boolean;
  owner: PropertyOwner;
};