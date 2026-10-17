import type { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import type { Property } from '@/types/property';
import { floorLabel, formatBdNumber, plural } from '@/utils/format';

export type ListingSpec = { icon: ComponentProps<typeof Ionicons>['name']; text: string };

/**
 * The short facts shown for a listing: "3 Beds", "2 Baths", "1,200 sqft".
 * `full` (details page) also adds balconies and the floor.
 * One place, so every card and the details page always agree.
 */
export function listingSpecs(
  p: Pick<Property, 'bedrooms' | 'bathrooms' | 'balconies' | 'sizeSqft' | 'floorNumber'>,
  full = false,
): ListingSpec[] {
  return [
    ...(p.bedrooms > 0 ? [{ icon: 'bed-outline' as const, text: plural(p.bedrooms, 'Bed') }] : []),
    { icon: 'water-outline', text: plural(p.bathrooms, 'Bath') },
    ...(full && p.balconies > 0
      ? [{ icon: 'sunny-outline' as const, text: plural(p.balconies, 'Balcony', 'Balconies') }]
      : []),
    ...(p.sizeSqft ? [{ icon: 'resize-outline' as const, text: `${formatBdNumber(p.sizeSqft)} sqft` }] : []),
    ...(full ? [{ icon: 'business-outline' as const, text: floorLabel(p.floorNumber) }] : []),
  ];
}