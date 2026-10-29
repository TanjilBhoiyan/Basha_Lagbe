/**
 * published = live and visible to tenants
 * pending   = submitted, waiting for admin review
 * rented    = owner marked it as rented (hidden from search)
 * expired   = not confirmed in time (hidden from search until the owner renews it)
 */
export type ListingStatus = 'published' | 'pending' | 'rented' | 'expired';

/** One of the logged-in owner's own listings. */
export type OwnerListing = {
  propertyId: string;
  status: ListingStatus;
  /** ISO timestamp. */
  postedAt: string;
  /** Live listings: the day it gets hidden unless the owner confirms, "2026-11-28". */
  hidesOn?: string;
};