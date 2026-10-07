import type { Location } from '@/types/location';

// MOCK data — will come from the backend (admin-managed) later.
export const MOCK_LOCATIONS: Location[] = [
  { id: 'dhaka-mirpur', name: 'Mirpur', city: 'Dhaka', listingCount: 1245, image: require('../../assets/images/locations/mirpur.jpg') },
  { id: 'dhaka-uttara', name: 'Uttara', city: 'Dhaka', listingCount: 892, image: require('../../assets/images/locations/uttara.jpg') },
  { id: 'dhaka-dhanmondi', name: 'Dhanmondi', city: 'Dhaka', listingCount: 756, image: require('../../assets/images/locations/dhanmondi.jpg') },
  { id: 'dhaka-bashundhara', name: 'Bashundhara', city: 'Dhaka', listingCount: 634, image: require('../../assets/images/locations/bashundhara.jpg') },
  { id: 'chattogram', name: 'Chattogram', city: 'Chattogram', listingCount: 482, image: require('../../assets/images/locations/chattogram.jpg') },
  { id: 'sylhet', name: 'Sylhet', city: 'Sylhet', listingCount: 318, image: require('../../assets/images/locations/sylhet.jpg') },
  // Areas without photos still show up in search.
  { id: 'dhaka-mohammadpur', name: 'Mohammadpur', city: 'Dhaka', listingCount: 540 },
  { id: 'dhaka-badda', name: 'Badda', city: 'Dhaka', listingCount: 410 },
  { id: 'dhaka-banani', name: 'Banani', city: 'Dhaka', listingCount: 298 },
  { id: 'dhaka-gulshan', name: 'Gulshan', city: 'Dhaka', listingCount: 276 },
  { id: 'dhaka-rampura', name: 'Rampura', city: 'Dhaka', listingCount: 265 },
  { id: 'dhaka-motijheel', name: 'Motijheel', city: 'Dhaka', listingCount: 142 },
  { id: 'rajshahi', name: 'Rajshahi', city: 'Rajshahi', listingCount: 201 },
  { id: 'khulna', name: 'Khulna', city: 'Khulna', listingCount: 188 },
];

/** Ids shown in the "Popular" lists, in order. */
export const POPULAR_LOCATION_IDS = [
  'dhaka-mirpur',
  'dhaka-uttara',
  'dhaka-dhanmondi',
  'dhaka-bashundhara',
  'chattogram',
  'sylhet',
];