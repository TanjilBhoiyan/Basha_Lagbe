import type { ImageSourcePropType } from 'react-native';

export type Location = {
  id: string;
  /** Area name, e.g. "Mirpur". For a whole city this equals the city name. */
  name: string;
  city: string;
  listingCount: number;
  /** Center of the area, used to position the map. */
  latitude: number;
  longitude: number;
  image?: ImageSourcePropType;
  /**
   * true = a point the user pinned on the map (not one of our areas).
   * The app then shows listings within NEAR_RADIUS_KM of it, nearest first.
   */
  isPin?: boolean;
};

/** "Near me" search radius for a pinned location. */
export const NEAR_RADIUS_KM = 5;

/** "Mirpur, Dhaka" — or just "Sylhet" when the location is a whole city. */
export function locationLabel(location: Pick<Location, 'name' | 'city'>): string {
  return location.name === location.city ? location.name : `${location.name}, ${location.city}`;
}