import type { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import { colors } from '@/theme';
import type { ListingStatus } from '@/types/listing';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export const LISTING_STATUS_STYLE: Record<
  ListingStatus,
  { label: string; icon: IconName; color: string; background: string }
> = {
  published: { label: 'Active', icon: 'circle', color: colors.primaryDeep, background: colors.primaryLight },
  pending: { label: 'Pending', icon: 'clock-outline', color: colors.warning, background: colors.warningLight },
  rented: { label: 'Rented', icon: 'key-variant', color: colors.info, background: colors.infoLight },
  expired: { label: 'Hidden', icon: 'eye-off-outline', color: colors.textSecondary, background: colors.surface },
};

/** "2026-11-28" -> "28 Nov" */
export function shortDate(isoDate: string) {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}