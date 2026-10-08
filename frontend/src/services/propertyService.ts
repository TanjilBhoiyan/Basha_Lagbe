import { DEFAULT_FILTERS, type PropertyFilters } from '@/features/filters/filters';
import type { Property } from '@/types/property';

import { apiImage, apiRequest } from './apiClient';

export type PropertySort = 'recommended' | 'price-asc' | 'price-desc';

/** What GET /properties returns. Photos are URLs, turned into <Image> sources here. */
type ApiProperty = Omit<Property, 'images'> & { images: string[] };
type ApiPage = { items: ApiProperty[]; total: number; page: number; limit: number };

const toProperty = (p: ApiProperty): Property => ({ ...p, images: p.images.map(apiImage) });

/** Filters -> query string, skipping everything that means "any". */
function toQuery(params: {
  filters?: PropertyFilters;
  query?: string;
  sort?: PropertySort;
  locationId?: string;
  limit?: number;
}): string {
  const f = params.filters ?? DEFAULT_FILTERS;
  const q = new URLSearchParams();
  if (params.query?.trim()) q.set('q', params.query.trim());
  if (f.minRent > 0) q.set('minRent', String(f.minRent));
  if (f.maxRent !== null) q.set('maxRent', String(f.maxRent));
  if (f.type) q.set('type', f.type);
  if (f.tenantType) q.set('tenantType', f.tenantType);
  if (f.bedrooms !== null) q.set('bedrooms', String(f.bedrooms));
  if (f.bathrooms !== null) q.set('bathrooms', String(f.bathrooms));
  if (f.furnishing) q.set('furnishing', f.furnishing);
  if (f.amenities.length) q.set('amenities', f.amenities.join(','));
  if (f.availableBy) q.set('availableBy', f.availableBy);
  if (params.locationId) q.set('locationId', params.locationId);
  if (params.sort) q.set('sort', params.sort);
  if (params.limit) q.set('limit', String(params.limit));
  const text = q.toString();
  return text ? `?${text}` : '';
}

/**
 * Favorites are kept on the server for the logged-in user.
 * A small in-memory copy keeps hearts in sync between screens without refetching.
 */
let favoriteCache: string[] | null = null;

export const propertyService = {
  /** Matching properties, with the selected location's listings first. */
  async getRecommended(params: { locationId?: string; filters?: PropertyFilters }): Promise<Property[]> {
    const result = await apiRequest<ApiPage>(`/properties${toQuery({ ...params, sort: 'recommended' })}`);
    return result.ok ? result.data.items.map(toProperty) : [];
  },

  /** Search screen: filters + free-text query + sort. */
  async search(params: {
    filters: PropertyFilters;
    query?: string;
    sort?: PropertySort;
    locationId?: string;
  }): Promise<Property[]> {
    const result = await apiRequest<ApiPage>(`/properties${toQuery({ ...params, limit: 50 })}`);
    return result.ok ? result.data.items.map(toProperty) : [];
  },

  /** One property, or null if it was removed / never existed. */
  async getById(id: string): Promise<Property | null> {
    const result = await apiRequest<ApiProperty>(`/properties/${encodeURIComponent(id)}`);
    return result.ok ? toProperty(result.data) : null;
  },

  /** Result count for the "Apply Filters" button. */
  async count(filters: PropertyFilters): Promise<number> {
    const result = await apiRequest<ApiPage>(`/properties${toQuery({ filters, limit: 1 })}`);
    return result.ok ? result.data.total : 0;
  },

  /** Oldest first (the Saved screen reverses it to show newest first). */
  async getFavoriteIds(): Promise<string[]> {
    const result = await apiRequest<string[]>('/favorites/ids', { auth: true });
    if (!result.ok) return favoriteCache ?? [];
    favoriteCache = [...result.data].reverse();
    return favoriteCache;
  },

  /** Returns the updated list of favorite ids. */
  async toggleFavorite(id: string): Promise<string[]> {
    const current = favoriteCache ?? (await this.getFavoriteIds());
    const saved = current.includes(id);
    const result = await apiRequest<null>(`/favorites/${encodeURIComponent(id)}`, {
      method: saved ? 'DELETE' : 'PUT',
      auth: true,
    });
    if (!result.ok) return current;
    favoriteCache = saved ? current.filter((x) => x !== id) : [...current, id];
    return favoriteCache;
  },
};