import AsyncStorage from '@react-native-async-storage/async-storage';

import { isSlotAvailable } from '@/features/visit/visitSlots';
import type { Result } from '@/types/auth';
import type { VisitRequest } from '@/types/visit';

const VISITS_KEY = 'basha-lagbe:visit-requests';
const delay = (ms = 800) => new Promise((resolve) => setTimeout(resolve, ms));

async function readAll(): Promise<VisitRequest[]> {
  try {
    const raw = await AsyncStorage.getItem(VISITS_KEY);
    return raw ? (JSON.parse(raw) as VisitRequest[]) : [];
  } catch {
    return [];
  }
}

async function writeAll(list: VisitRequest[]) {
  try {
    await AsyncStorage.setItem(VISITS_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

const isActive = (v: VisitRequest) => v.status === 'pending' || v.status === 'confirmed';

// MOCK service — will call the backend API later (which also notifies the owner).
export const visitService = {
  /** The tenant's open (pending / confirmed) request for this property, if any. */
  async getActiveForProperty(propertyId: string): Promise<VisitRequest | null> {
    const list = await readAll();
    return list.find((v) => v.propertyId === propertyId && isActive(v)) ?? null;
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
    const existing = list.find((v) => v.propertyId === input.propertyId && isActive(v));
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