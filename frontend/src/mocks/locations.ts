import type { Location } from '@/types/location';

// MOCK data — will come from the backend (admin-managed) later.
export const MOCK_LOCATIONS: Location[] = [
  { id: 'dhaka-mirpur', name: 'Mirpur', city: 'Dhaka', listingCount: 1245, latitude: 23.8223, longitude: 90.3654, image: require('../../assets/images/locations/mirpur.jpg') },
  { id: 'dhaka-uttara', name: 'Uttara', city: 'Dhaka', listingCount: 892, latitude: 23.8759, longitude: 90.3795, image: require('../../assets/images/locations/uttara.jpg') },
  { id: 'dhaka-dhanmondi', name: 'Dhanmondi', city: 'Dhaka', listingCount: 756, latitude: 23.7461, longitude: 90.3742, image: require('../../assets/images/locations/dhanmondi.jpg') },
  { id: 'dhaka-bashundhara', name: 'Bashundhara', city: 'Dhaka', listingCount: 634, latitude: 23.8193, longitude: 90.4526, image: require('../../assets/images/locations/bashundhara.jpg') },
  { id: 'chattogram', name: 'Chattogram', city: 'Chattogram', listingCount: 482, latitude: 22.3569, longitude: 91.7832, image: require('../../assets/images/locations/chattogram.jpg') },
  { id: 'sylhet', name: 'Sylhet', city: 'Sylhet', listingCount: 318, latitude: 24.8949, longitude: 91.8687, image: require('../../assets/images/locations/sylhet.jpg') },
  // Areas without photos still show up in search.
  { id: 'dhaka-mohammadpur', name: 'Mohammadpur', city: 'Dhaka', listingCount: 540, latitude: 23.7662, longitude: 90.3589 },
  { id: 'dhaka-badda', name: 'Badda', city: 'Dhaka', listingCount: 410, latitude: 23.7808, longitude: 90.4267 },
  { id: 'dhaka-banani', name: 'Banani', city: 'Dhaka', listingCount: 298, latitude: 23.7937, longitude: 90.4066 },
  { id: 'dhaka-gulshan', name: 'Gulshan', city: 'Dhaka', listingCount: 276, latitude: 23.7925, longitude: 90.4078 },
  { id: 'dhaka-rampura', name: 'Rampura', city: 'Dhaka', listingCount: 265, latitude: 23.7613, longitude: 90.421 },
  { id: 'dhaka-motijheel', name: 'Motijheel', city: 'Dhaka', listingCount: 142, latitude: 23.733, longitude: 90.4172 },
  { id: 'rajshahi', name: 'Rajshahi', city: 'Rajshahi', listingCount: 201, latitude: 24.3745, longitude: 88.6042 },
  { id: 'khulna', name: 'Khulna', city: 'Khulna', listingCount: 188, latitude: 22.8456, longitude: 89.5403 },
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