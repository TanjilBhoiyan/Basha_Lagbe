import type { LatLng } from './mapTypes';

/** A spot the owner pinned for a listing, with its name ("GP Chha Road" + "Mohakhali"). */
export type PinnedPlace = LatLng & { name: string; city: string };

let pending: PinnedPlace | null = null;

/**
 * Hand-off from the map picker back to the Add/Edit Property form:
 * the picker calls set() and goes back; the form calls take() when it is on screen again.
 */
export const pinResult = {
  set(place: PinnedPlace) {
    pending = place;
  },
  /** The new pin (once), or null if the owner went back without confirming. */
  take(): PinnedPlace | null {
    const place = pending;
    pending = null;
    return place;
  },
};