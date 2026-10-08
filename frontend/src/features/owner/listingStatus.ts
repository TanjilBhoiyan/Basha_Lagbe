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
};