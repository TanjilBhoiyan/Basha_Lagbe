import { displayStatus, isActiveVisit, tabOf, type VisitTab } from '@/features/visit/visitStatus';
import { slotStart } from '@/features/visit/visitSlots';
import type { Result } from '@/types/auth';
import type { VisitRequest } from '@/types/visit';

import { apiRequest } from './apiClient';

/** Visit requests live on the backend (/visits). The owner confirms or declines them. */
export const visitService = {
  /** The tenant's open (pending / confirmed, still ahead) request for this property, if any. */
  async getActiveForProperty(propertyId: string): Promise<VisitRequest | null> {
    const result = await apiRequest<VisitRequest[]>(
      `/visits/mine?propertyId=${encodeURIComponent(propertyId)}`,
      { auth: true },
    );
    if (!result.ok) return null;
    return result.data.find((v) => isActiveVisit(v)) ?? null;
  },

  /** All requests grouped by tab: pending & upcoming soonest first, past newest first. */
  async getGrouped(): Promise<Record<VisitTab, VisitRequest[]>> {
    const groups: Record<VisitTab, VisitRequest[]> = { pending: [], upcoming: [], past: [] };
    const result = await apiRequest<VisitRequest[]>('/visits/mine', { auth: true });
    if (!result.ok) return groups;

    result.data.forEach((v) => groups[tabOf(displayStatus(v))].push(v));
    const time = (v: VisitRequest) => slotStart(v.date, v.time).getTime();
    groups.pending.sort((a, b) => time(a) - time(b));
    groups.upcoming.sort((a, b) => time(a) - time(b));
    groups.past.sort((a, b) => time(b) - time(a));
    return groups;
  },

  /**
   * Sends a visit request. One open request per property:
   * sending again replaces the previous pending one.
   */
  async request(input: {
    propertyId: string;
    date: string;
    time: string;
    message: string;
  }): Promise<Result<VisitRequest>> {
    return apiRequest<VisitRequest>('/visits', { method: 'POST', body: input, auth: true });
  },

  async cancel(id: string): Promise<void> {
    await apiRequest<VisitRequest>(`/visits/${encodeURIComponent(id)}/cancel`, {
      method: 'POST',
      auth: true,
    });
  },
};