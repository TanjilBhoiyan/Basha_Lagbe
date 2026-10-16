import * as ExpoLocation from 'expo-location';

import { apiRequest } from '@/services/apiClient';

import type { LatLng } from './mapTypes';

export type PlaceName = { name: string; city: string };

const FALLBACK: PlaceName = { name: 'Pinned location', city: 'Pinned location' };

/** "Dhaka District" -> "Dhaka", "Dhaka Division" -> "Dhaka" */
const clean = (s?: string | null) => s?.replace(/\s+(District|Division)$/i, '').trim() || undefined;

/** Plus codes like "QCH5+PWX" are not names people use. */
const isPlusCode = (s: string) => /^[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,3}$/i.test(s);

/** Our backend: the area people use ("Mohakhali") and the city ("Dhaka"), from OpenStreetMap. */
async function fromServer(point: LatLng): Promise<PlaceName | null> {
  const result = await apiRequest<{ name: string | null; city: string | null }>(
    `/geocode/reverse?lat=${point.latitude}&lng=${point.longitude}`,
  );
  if (!result.ok || !result.data.name) return null;
  return { name: result.data.name, city: result.data.city ?? result.data.name };
}

type PhoneAddress = { road?: string; area?: string; city?: string };

/** The phone's own geocoder (Android uses Google's data): good road names ("GP Chha Road"). */
async function fromPhone(point: LatLng): Promise<PhoneAddress | null> {
  try {
    const [a] = await ExpoLocation.reverseGeocodeAsync(point);
    if (!a) return null;
    const road = clean(a.street);
    return {
      road: road && !isPlusCode(road) ? road : undefined,
      area: clean(a.district),
      city: clean(a.city) ?? clean(a.subregion) ?? clean(a.region),
    };
  } catch {
    return null; // no geocoder (web) or no network
  }
}

/**
 * "GP Chha Road" + "Mohakhali" for a point: road from the phone, area from our server.
 * Falls back to whatever is available, then "Pinned location". Never throws.
 */
export async function placeName(point: LatLng): Promise<PlaceName> {
  const [server, phone] = await Promise.all([fromServer(point), fromPhone(point)]);
  const area = server?.name ?? phone?.area;
  const city = server?.city ?? phone?.city;
  const road = phone?.road;

  if (road && area) return { name: road, city: area }; // "GP Chha Road, Mohakhali"
  if (area) return { name: area, city: city ?? area }; // "Mohakhali, Dhaka"
  if (road) return { name: road, city: city ?? road }; // "GP Chha Road, Dhaka"
  if (city) return { name: city, city }; // "Dhaka"
  return FALLBACK;
}