import { draftFromProperty, type PropertyDraft } from '@/features/post/draft';
import type { Result } from '@/types/auth';
import type { ListingStatus, OwnerListing } from '@/types/listing';
import type { Property } from '@/types/property';

import { apiImage, apiRequest } from './apiClient';

/** GET /properties/mine returns full properties plus their status and post date. */
type ApiMyProperty = Omit<Property, 'images'> & {
  images: string[];
  status: ListingStatus | 'rejected';
  createdAt: string;
};

export type MyListings = {
  listings: OwnerListing[];
  /** The property for each listing, by id. */
  properties: Record<string, Property>;
};

/** The logged-in owner's own listings (backend: /properties/mine). */
export const ownerListingService = {
  /** Newest first. Rejected listings are hidden for now (no screen for them yet). */
  async getMyListings(): Promise<MyListings> {
    const result = await apiRequest<ApiMyProperty[]>('/properties/mine', { auth: true });
    const empty: MyListings = { listings: [], properties: {} };
    if (!result.ok) return empty;

    return result.data.reduce<MyListings>((acc, { status, createdAt, images, ...p }) => {
      if (status === 'rejected') return acc;
      acc.listings.push({ propertyId: p.id, status, postedAt: createdAt });
      acc.properties[p.id] = { ...p, images: images.map(apiImage) };
      return acc;
    }, empty);
  },

  /** One of my listings as an Add Property draft, for the Edit form (includes the private address). */
  async getDraft(propertyId: string): Promise<PropertyDraft | null> {
    const result = await apiRequest<ApiMyProperty & { address: string }>(
      `/properties/mine/${encodeURIComponent(propertyId)}`,
      { auth: true },
    );
    if (!result.ok) return null;
    const { images, ...p } = result.data;
    return draftFromProperty(p, images.map((url) => ({ uri: apiImage(url).uri, remoteUrl: url })));
  },

  /** Mark as rented, or available (published) again. */
  async setStatus(propertyId: string, status: ListingStatus): Promise<Result<null>> {
    const result = await apiRequest<unknown>(`/properties/${encodeURIComponent(propertyId)}/status`, {
      method: 'PATCH',
      body: { status },
      auth: true,
    });
    return result.ok ? { ok: true, data: null } : result;
  },

  async remove(propertyId: string): Promise<Result<null>> {
    const result = await apiRequest<null>(`/properties/${encodeURIComponent(propertyId)}`, {
      method: 'DELETE',
      auth: true,
    });
    return result.ok ? { ok: true, data: null } : result;
  },
};