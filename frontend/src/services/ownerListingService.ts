import AsyncStorage from '@react-native-async-storage/async-storage';

import { MOCK_MY_LISTINGS } from '@/mocks/myListings';
import type { ListingStatus, OwnerListing } from '@/types/listing';

const CHANGES_KEY = 'basha-lagbe:my-listing-changes';
const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms));

/** Local changes on top of the mock data: new status, or "deleted". */
type Changes = Record<string, ListingStatus | 'deleted'>;

async function readChanges(): Promise<Changes> {
  try {
    const raw = await AsyncStorage.getItem(CHANGES_KEY);
    return raw ? (JSON.parse(raw) as Changes) : {};
  } catch {
    return {};
  }
}

async function writeChange(propertyId: string, value: ListingStatus | 'deleted') {
  const changes = await readChanges();
  changes[propertyId] = value;
  try {
    await AsyncStorage.setItem(CHANGES_KEY, JSON.stringify(changes));
  } catch {
    // ignore
  }
}

// MOCK service — will call the backend API later.
export const ownerListingService = {
  /** The owner's listings, newest first. */
  async getMyListings(): Promise<OwnerListing[]> {
    await delay();
    const changes = await readChanges();
    return MOCK_MY_LISTINGS.filter((l) => changes[l.propertyId] !== 'deleted')
      .map((l) => {
        const change = changes[l.propertyId];
        return change && change !== 'deleted' ? { ...l, status: change } : l;
      })
      .sort((a, b) => b.postedAt.localeCompare(a.postedAt));
  },

  /** Mark as rented, or available (published) again. */
  async setStatus(propertyId: string, status: ListingStatus): Promise<void> {
    await delay(300);
    await writeChange(propertyId, status);
  },

  async remove(propertyId: string): Promise<void> {
    await delay(300);
    await writeChange(propertyId, 'deleted');
  },
};