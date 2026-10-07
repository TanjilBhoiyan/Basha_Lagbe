import type { ImageSourcePropType } from 'react-native';

export type PropertyType = 'apartment' | 'room' | 'house' | 'sublet' | 'office' | 'shop' | 'mess';

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
  images: ImageSourcePropType[];
  isVerified: boolean;
  owner: { name: string; phone: string };
};