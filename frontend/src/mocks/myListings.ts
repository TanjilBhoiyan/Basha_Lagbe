import type { OwnerListing } from '@/types/listing';

import { SAMPLE_PROPERTY_IDS as ID } from './sampleIds';

// MOCK: the logged-in owner's listings (reusing the sample properties).
export const MOCK_MY_LISTINGS: OwnerListing[] = [
  { propertyId: ID.p1, status: 'published', postedAt: '2026-09-28T10:00:00.000Z' },
  { propertyId: ID.p5, status: 'pending', postedAt: '2026-10-05T09:00:00.000Z' },
  { propertyId: ID.p4, status: 'rented', postedAt: '2026-08-12T08:00:00.000Z' },
  { propertyId: ID.p2, status: 'published', postedAt: '2026-09-15T12:00:00.000Z' },
  { propertyId: ID.p6, status: 'published', postedAt: '2026-09-02T07:30:00.000Z' },
];