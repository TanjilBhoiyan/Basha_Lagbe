/**
 * published = live and visible to tenants
 * pending   = submitted, waiting for admin review
 * rented    = owner marked it as rented (hidden from search)
 */
export type ListingStatus = 'published' | 'pending' | 'rented';

/** One of the logged-in owner's own listings. */
export type OwnerListing = {
  propertyId: string;
  status: ListingStatus;
  /** ISO timestamp. */
  postedAt: string;
};