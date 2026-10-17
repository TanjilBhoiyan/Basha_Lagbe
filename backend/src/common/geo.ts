/** Small map helpers shared by geocode, places and properties. */

/** "Dhaka District" / "Dhaka Division" / "Dhaka City Corporation" -> "Dhaka" */
export const cleanPlaceName = (s?: string) =>
  s?.replace(/\s+(District|Division|City Corporation)$/i, '').trim() || undefined;

/** Google plus code like "QCH5+PJ4": not a name people use. Same rule as frontend placeName.ts. */
const PLUS_CODE = /^[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,3}$/i;
export const isPlusCode = (s: string) => PLUS_CODE.test(s.trim());

/** Points closer than ~100 m share one cache entry (3 decimal places). */
export const geoCacheKey = (lat: number, lng: number) => `${lat.toFixed(3)},${lng.toFixed(3)}`;

/** Straight-line distance in km between two points (Haversine). */
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}