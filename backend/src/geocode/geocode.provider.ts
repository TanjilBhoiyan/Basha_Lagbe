/** "Mohakhali" + "Dhaka" for a point on the map. */
export type PlaceName = { name: string; city: string };

/**
 * Every place-name service is one class with this shape (see ./providers).
 * To switch service: add a provider file, list it in geocode.service.ts, set GEOCODE_PROVIDER in .env.
 */
export interface GeocodeProvider {
  /** null when the service has no name for this point. Throws when it can't be reached. */
  reverse(lat: number, lng: number): Promise<PlaceName | null>;
}