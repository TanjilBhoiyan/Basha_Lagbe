import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_FILTERS, matchesFilters, type PropertyFilters } from '@/features/filters/filters';
import { MOCK_PROPERTIES } from '@/mocks/properties';
import type { Property } from '@/types/property';

export type PropertySort = 'recommended' | 'price-asc' | 'price-desc';

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

  /**
   * Search screen: filters + free-text query + sort.
   * The query matches the title or the public area label.
   */
  async search(params: {
    filters: PropertyFilters;
    query?: string;
    sort?: PropertySort;
    locationId?: string;
  }): Promise<Property[]> {
    await delay(500);
    const q = params.query?.trim().toLowerCase() ?? '';
    const list = MOCK_PROPERTIES.filter(
      (p) =>
        matchesFilters(p, params.filters) &&
        (!q || p.title.toLowerCase().includes(q) || p.areaLabel.toLowerCase().includes(q)),
    );
    switch (params.sort ?? 'recommended') {
      case 'price-asc':
        return list.sort((a, b) => a.monthlyRent - b.monthlyRent);
      case 'price-desc':
        return list.sort((a, b) => b.monthlyRent - a.monthlyRent);
      default:
        return list.sort(
          (a, b) =>
            Number(b.locationId === params.locationId) -
            Number(a.locationId === params.locationId),
        );
    }
  },
    /** One property, or null if it was removed / never existed. */
  async getById(id: string): Promise<Property | null> {
    await delay(400);
    return MOCK_PROPERTIES.find((p) => p.id === id) ?? null;
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
export function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}