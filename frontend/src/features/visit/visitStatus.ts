import type { ComponentProps } from 'react';
import type { MaterialCommunityIcons } from '@expo/vector-icons';

import { colors } from '@/theme';
import type { VisitRequest } from '@/types/visit';
import { slotEnd, slotStart } from './visitSlots';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export type VisitTab = 'pending' | 'upcoming' | 'past';

/** What the tenant sees — the stored status plus time (e.g. a pending request whose day passed = expired). */
export type VisitDisplayStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'declined'
  | 'cancelled'
  | 'expired';

export function displayStatus(v: VisitRequest, now = new Date()): VisitDisplayStatus {
  if (v.status === 'pending') return slotStart(v.date, v.time) > now ? 'pending' : 'expired';
  if (v.status === 'confirmed') return slotEnd(v.date, v.time) > now ? 'confirmed' : 'completed';
  return v.status;
}

/** Pending or confirmed and still ahead — only one of these per property. */
export function isActiveVisit(v: VisitRequest, now = new Date()) {
  const s = displayStatus(v, now);
  return s === 'pending' || s === 'confirmed';
}

export function tabOf(status: VisitDisplayStatus): VisitTab {
  if (status === 'pending') return 'pending';
  if (status === 'confirmed') return 'upcoming';
  return 'past';
}

export const STATUS_STYLE: Record<
  VisitDisplayStatus,
  { label: string; icon: IconName; color: string; background: string }
> = {
  pending: { label: 'Pending', icon: 'clock-outline', color: colors.warning, background: colors.warningLight },
  confirmed: { label: 'Confirmed', icon: 'check', color: colors.primaryDeep, background: colors.primaryLight },
  completed: { label: 'Completed', icon: 'check', color: colors.textSecondary, background: colors.surface },
  declined: { label: 'Declined', icon: 'close', color: colors.danger, background: colors.dangerLight },
  cancelled: { label: 'Cancelled', icon: 'cancel', color: colors.textSecondary, background: colors.surface },
  expired: { label: 'Expired', icon: 'timer-sand-complete', color: colors.textSecondary, background: colors.surface },
};