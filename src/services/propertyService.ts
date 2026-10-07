import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_FILTERS, matchesFilters, type PropertyFilters } from '@/features/filters/filters';
import { MOCK_PROPERTIES } from '@/mocks/properties';
import type { Property } from '@/types/property';

const FAVORITES_KEY = 'basha-lagbe:favorites';
const delay = (ms = 700) => new Promise((resolve) => setTimeout(resolve, ms));

// MOCK service — will call the backend API later.
export const propertyService = {
  /** Matching properties, with the selected location's listings first. */
  async getRecommended(params: {
    locationId?: string;
    filters?: PropertyFilters;
  }): Promise<Property[]> {
    await delay();
    const filters = params.filters ?? DEFAULT_FILTERS;
    return MOCK_PROPERTIES.filter((p) => matchesFilters(p, filters)).sort(
      (a, b) =>
        Number(b.locationId === params.locationId) - Number(a.locationId === params.locationId),
    );
  },

  /** Result count for the "Apply Filters" button. */
  async count(filters: PropertyFilters): Promise<number> {
    await delay(150);
    return MOCK_PROPERTIES.filter((p) => matchesFilters(p, filters)).length;
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