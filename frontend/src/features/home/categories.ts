import type { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import type { PropertyType } from '@/types/property';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export type HomeCategory = {
  /** `null` = the "More" tile, which opens the full category list. */
  type: PropertyType | null;
  label: string;
  icon: IconName;
};

// TODO: load property types from the backend (admin can add new ones).
export const HOME_CATEGORIES: HomeCategory[] = [
  { type: 'apartment', label: 'Apartment', icon: 'office-building' },
  { type: 'room', label: 'Room', icon: 'bed' },
  { type: 'house', label: 'House', icon: 'home' },
  { type: 'sublet', label: 'Sublet', icon: 'home-switch' },
  { type: 'office', label: 'Office', icon: 'briefcase' },
  { type: 'shop', label: 'Shop', icon: 'storefront' },
  { type: 'mess', label: 'Mess', icon: 'account-group' },
  { type: null, label: 'More', icon: 'dots-horizontal' },
];