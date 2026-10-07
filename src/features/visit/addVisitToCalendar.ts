import * as Calendar from 'expo-calendar/legacy';

import { APP_CONFIG } from '@/config/app';
import type { Property } from '@/types/property';
import type { VisitRequest } from '@/types/visit';
import { slotEnd, slotStart } from './visitSlots';

/**
 * Opens the phone's own "new event" screen, pre-filled with the visit.
 * The user saves it there — no calendar permission needed.
 * Returns false if the device has no calendar app (or on web).
 */
export async function addVisitToCalendar(visit: VisitRequest, property: Property): Promise<boolean> {
  try {
    await Calendar.createEventInCalendarAsync({
      title: `House visit: ${property.title}`,
      startDate: slotStart(visit.date, visit.time),
      endDate: slotEnd(visit.date, visit.time),
      location: property.areaLabel,
      notes: `Owner: ${property.owner.name} (+880${property.owner.phone})\nBooked via ${APP_CONFIG.name}`,
      alarms: [{ relativeOffset: -60 }],
    });
    return true;
  } catch {
    return false;
  }
}