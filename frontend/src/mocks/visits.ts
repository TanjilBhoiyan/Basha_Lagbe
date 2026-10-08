import { toLocalIso } from '@/features/visit/visitSlots';
import type { VisitRequest } from '@/types/visit';

/** Sample requests (dates relative to today) so every tab has something to show. */
export function seedVisits(now = new Date()): VisitRequest[] {
  const day = (offset: number) =>
    toLocalIso(new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset));
  const created = (offset: number) =>
    new Date(now.getTime() + offset * 24 * 60 * 60 * 1000).toISOString();

  return [
    { id: 'v_seed_1', propertyId: 'p4', date: day(3), time: '12:00', status: 'pending', message: 'Hi, I would like to see the room.', createdAt: created(-1) },
    { id: 'v_seed_2', propertyId: 'p2', date: day(2), time: '10:00', status: 'confirmed', message: 'Hi, I would like to visit the flat.', createdAt: created(-2) },
    { id: 'v_seed_3', propertyId: 'p5', date: day(-5), time: '14:00', status: 'completed', message: 'Hi, is the room still available?', createdAt: created(-7) },
    { id: 'v_seed_4', propertyId: 'p3', date: day(-8), time: '16:00', status: 'declined', message: 'Hi, can I see the house?', createdAt: created(-10) },
    { id: 'v_seed_5', propertyId: 'p7', date: day(-12), time: '10:00', status: 'cancelled', message: 'Hi, I would like to visit.', createdAt: created(-14) },
  ];
}