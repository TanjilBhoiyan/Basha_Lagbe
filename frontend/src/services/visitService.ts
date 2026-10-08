import AsyncStorage from '@react-native-async-storage/async-storage';

import { displayStatus, isActiveVisit, tabOf, type VisitTab } from '@/features/visit/visitStatus';
import { isSlotAvailable, slotStart } from '@/features/visit/visitSlots';
import { seedVisits } from '@/mocks/visits';
import type { Result } from '@/types/auth';
import type { VisitRequest } from '@/types/visit';

const VISITS_KEY = 'basha-lagbe:visit-requests-v2';
const SEEDED_KEY = 'basha-lagbe:visit-requests-v2-seeded';
const delay = (ms = 800) => new Promise((resolve) => setTimeout(resolve, ms));

async function writeAll(list: VisitRequest[]) {
  try {
    await AsyncStorage.setItem(VISITS_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

async function readAll(): Promise<VisitRequest[]> {
  try {
    const raw = await AsyncStorage.getItem(VISITS_KEY);
    let list = raw ? (JSON.parse(raw) as VisitRequest[]) : [];
    // MOCK: add sample requests once (skipping properties the user already requested).
    if (!(await AsyncStorage.getItem(SEEDED_KEY))) {
      const seeds = seedVisits().filter((s) => !list.some((v) => v.propertyId === s.propertyId));
      list = [...list, ...seeds];
      await writeAll(list);
      await AsyncStorage.setItem(SEEDED_KEY, '1');
    }
    return list;
  } catch {
    return [];
  }
}

// MOCK service — will call the backend API later (which also notifies the owner).
export const visitService = {
  /** The tenant's open (pending / confirmed, still ahead) request for this property, if any. */
  async getActiveForProperty(propertyId: string): Promise<VisitRequest | null> {
    const list = await readAll();
    return list.find((v) => v.propertyId === propertyId && isActiveVisit(v)) ?? null;
  },

  /** All requests grouped by tab: pending & upcoming soonest first, past newest first. */
  async getGrouped(): Promise<Record<VisitTab, VisitRequest[]>> {
    await delay(500);
    const list = await readAll();
    const groups: Record<VisitTab, VisitRequest[]> = { pending: [], upcoming: [], past: [] };
    list.forEach((v) => groups[tabOf(displayStatus(v))].push(v));
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
    await delay();
    if (!isSlotAvailable(input.date, input.time)) {
      return { ok: false, error: 'This time is no longer available. Please pick another slot.' };
    }
    const list = await readAll();
    const existing = list.find((v) => v.propertyId === input.propertyId && isActiveVisit(v));
    if (existing?.status === 'confirmed') {
      return { ok: false, error: 'Your visit is already confirmed by the owner.' };
    }
    const request: VisitRequest = {
      id: existing?.id ?? `v_${Date.now()}`,
      propertyId: input.propertyId,
      date: input.date,
      time: input.time,
      message: input.message.trim(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    await writeAll([request, ...list.filter((v) => v.id !== request.id)]);
    return { ok: true, data: request };
  },

  async cancel(id: string): Promise<void> {
    await delay(400);
    const list = await readAll();
    await writeAll(list.map((v) => (v.id === id ? { ...v, status: 'cancelled' } : v)));
  },
};