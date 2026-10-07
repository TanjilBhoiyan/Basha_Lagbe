import AsyncStorage from '@react-native-async-storage/async-storage';

import { MOCK_PROPERTIES } from '@/mocks/properties';
import type { Property, PropertyType } from '@/types/property';

const FAVORITES_KEY = 'basha-lagbe:favorites';
const delay = (ms = 700) => new Promise((resolve) => setTimeout(resolve, ms));

// MOCK service — will call the backend API later.
export const propertyService = {
  /**
   * Properties in the selected location first, then everything else,
   * optionally filtered by type.
   */
  async getRecommended(params: { locationId?: string; type?: PropertyType }): Promise<Property[]> {
    await delay();
    const list = params.type
      ? MOCK_PROPERTIES.filter((p) => p.type === params.type)
      : MOCK_PROPERTIES;
    return [...list].sort(
      (a, b) =>
        Number(b.locationId === params.locationId) - Number(a.locationId === params.locationId),
    );
  },

  async getFavoriteIds(): Promise<string[]> {
    try {
      const raw = await AsyncStorage.getItem(FAVORITES_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  },

  /** Returns the updated list of favorite ids. */
  async toggleFavorite(id: string): Promise<string[]> {
    const current = await this.getFavoriteIds();
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    try {
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
    return next;
  },
};