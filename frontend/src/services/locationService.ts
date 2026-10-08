import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Location } from '@/types/location';

import { apiImage, apiRequest } from './apiClient';

/** v2: the whole location is stored (not just the id) so the app can start offline. */
const SELECTED_KEY = 'basha-lagbe:selected-location-v2';
const RECENT_KEY = 'basha-lagbe:recent-locations';
const MAX_RECENT = 5;

type ApiLocation = Omit<Location, 'image'> & { imageUrl: string | null };

const toLocation = ({ imageUrl, ...l }: ApiLocation): Location => ({
  ...l,
  image: imageUrl ? apiImage(imageUrl) : undefined,
});

async function readIds(key: string): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

async function fetchLocations(query: string): Promise<Location[]> {
  const result = await apiRequest<ApiLocation[]>(`/locations${query}`);
  return result.ok ? result.data.map(toLocation) : [];
}

export const locationService = {
  async getPopular(): Promise<Location[]> {
    return fetchLocations('');
  },

  async getRecent(): Promise<Location[]> {
    const ids = await readIds(RECENT_KEY);
    return ids.length ? fetchLocations(`?ids=${ids.map(encodeURIComponent).join(',')}`) : [];
  },

  /** Case-insensitive match on area or city name. */
  async search(query: string): Promise<Location[]> {
    const q = query.trim();
    return q ? fetchLocations(`?q=${encodeURIComponent(q)}`) : [];
  },

  async getSelected(): Promise<Location | null> {
    try {
      const raw = await AsyncStorage.getItem(SELECTED_KEY);
      return raw ? (JSON.parse(raw) as Location) : null;
    } catch {
      return null;
    }
  },

  /** Saves the chosen location and moves it to the top of "Recent". */
  async select(location: Location): Promise<void> {
    try {
      const recent = (await readIds(RECENT_KEY)).filter((id) => id !== location.id);
      await AsyncStorage.multiSet([
        [SELECTED_KEY, JSON.stringify(location)],
        [RECENT_KEY, JSON.stringify([location.id, ...recent].slice(0, MAX_RECENT))],
      ]);
    } catch {
      // ignore
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([SELECTED_KEY, RECENT_KEY]);
    } catch {
      // ignore
    }
  },
};