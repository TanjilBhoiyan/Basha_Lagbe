import AsyncStorage from '@react-native-async-storage/async-storage';

import { MOCK_LOCATIONS, POPULAR_LOCATION_IDS } from '@/mocks/locations';
import type { Location } from '@/types/location';

const SELECTED_KEY = 'basha-lagbe:selected-location';
const RECENT_KEY = 'basha-lagbe:recent-locations';
const MAX_RECENT = 5;

const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));
const byId = (id: string) => MOCK_LOCATIONS.find((l) => l.id === id);

async function readIds(key: string): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

// MOCK service — location lists will come from the backend later.
export const locationService = {
  async getPopular(): Promise<Location[]> {
    await delay();
    return POPULAR_LOCATION_IDS.map(byId).filter((l): l is Location => !!l);
  },

  async getRecent(): Promise<Location[]> {
    const ids = await readIds(RECENT_KEY);
    return ids.map(byId).filter((l): l is Location => !!l);
  },

  /** Case-insensitive match on area or city name. */
  async search(query: string): Promise<Location[]> {
    await delay(200);
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return MOCK_LOCATIONS.filter(
      (l) => l.name.toLowerCase().includes(q) || l.city.toLowerCase().includes(q),
    );
  },

  async getSelected(): Promise<Location | null> {
    try {
      const id = await AsyncStorage.getItem(SELECTED_KEY);
      return id ? (byId(id) ?? null) : null;
    } catch {
      return null;
    }
  },

  /** Saves the chosen location and moves it to the top of "Recent". */
  async select(location: Location): Promise<void> {
    try {
      const recent = (await readIds(RECENT_KEY)).filter((id) => id !== location.id);
      await AsyncStorage.multiSet([
        [SELECTED_KEY, location.id],
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