import type { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import type { Amenity, Furnishing, Property, PropertyType, TenantType } from '@/types/property';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

/** Every filter the app supports. `null` / empty means "any". */
export type PropertyFilters = {
  /** Rent limits in BDT. `maxRent: null` means no upper limit. */
  minRent: number;
  maxRent: number | null;
  type: PropertyType | null;
  tenantType: TenantType | null;
  /** `4` means "4 or more". */
  bedrooms: number | null;
  bathrooms: number | null;
  furnishing: Furnishing | null;
  /** The property must have ALL of these. */
  amenities: Amenity[];
  /** ISO date; the property must be available on or before this date. */
  availableBy: string | null;
};

export const DEFAULT_FILTERS: PropertyFilters = {
  minRent: 0,
  maxRent: null,
  type: null,
  tenantType: null,
  bedrooms: null,
  bathrooms: null,
  furnishing: null,
  amenities: [],
  availableBy: null,
};

/** Snap points of the price slider. The last one means "100K or more". */
export const PRICE_STEPS = [0, 5000, 10000, 15000, 20000, 25000, 30000, 40000, 50000, 75000, 100000];
export const PRICE_LABEL_STEPS = [0, 10000, 20000, 50000, 100000];

function countMatches(value: number, wanted: number | null) {
  if (wanted === null) return true;
  return wanted >= 4 ? value >= 4 : value === wanted;
}

export function matchesFilters(p: Property, f: PropertyFilters): boolean {
  if (p.monthlyRent < f.minRent) return false;
  if (f.maxRent !== null && p.monthlyRent > f.maxRent) return false;
  if (f.type && p.type !== f.type) return false;
  if (f.tenantType && !p.tenantTypes.includes(f.tenantType)) return false;
  if (!countMatches(p.bedrooms, f.bedrooms)) return false;
  if (!countMatches(p.bathrooms, f.bathrooms)) return false;
  if (f.furnishing && p.furnishing !== f.furnishing) return false;
  if (!f.amenities.every((a) => p.amenities.includes(a))) return false;
  if (f.availableBy && p.availableFrom > f.availableBy) return false;
  return true;
}

/** How many filters differ from the defaults (shown as a badge). */
export function activeFilterCount(f: PropertyFilters): number {
  let n = 0;
  if (f.minRent > 0 || f.maxRent !== null) n++;
  if (f.type) n++;
  if (f.tenantType) n++;
  if (f.bedrooms !== null) n++;
  if (f.bathrooms !== null) n++;
  if (f.furnishing) n++;
  if (f.availableBy) n++;
  return n + f.amenities.length;
}

export const TENANT_OPTIONS: { value: TenantType; label: string; icon: IconName }[] = [
  { value: 'family', label: 'Family', icon: 'account-group' },
  { value: 'bachelor-male', label: 'Bachelor\nMale', icon: 'human-male' },
  { value: 'bachelor-female', label: 'Bachelor\nFemale', icon: 'human-female' },
  { value: 'student', label: 'Students', icon: 'school' },
  { value: 'professional', label: 'Professionals', icon: 'briefcase' },
];

export const FURNISHING_OPTIONS: { value: Furnishing; label: string; icon: IconName }[] = [
  { value: 'furnished', label: 'Furnished', icon: 'sofa' },
  { value: 'semi-furnished', label: 'Semi-Furnished', icon: 'bed-empty' },
  { value: 'unfurnished', label: 'Unfurnished', icon: 'cube-outline' },
];

// TODO: load amenities from the backend (admin can add new ones).
export const AMENITY_OPTIONS: { value: Amenity; label: string; icon: IconName }[] = [
  { value: 'wifi', label: 'WiFi', icon: 'wifi' },
  { value: 'parking', label: 'Parking', icon: 'car' },
  { value: 'ac', label: 'AC', icon: 'snowflake' },
  { value: 'generator', label: 'Generator', icon: 'lightning-bolt' },
  { value: 'lift', label: 'Lift', icon: 'elevator-passenger' },
  { value: 'security', label: 'Security', icon: 'shield-check' },
  { value: 'gas', label: 'Gas Connection', icon: 'fire' },
  { value: 'water', label: 'Water Supply', icon: 'water' },
  { value: 'balcony', label: 'Balcony', icon: 'balcony' },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function toIso(d: Date) {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function formatIsoDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/**
 * Rentals in Bangladesh usually start on the 1st of a month,
 * so "Available From" offers "now" plus the next three month starts.
 */
export function availableByOptions(today = new Date()) {
  const options: { value: string | null; label: string }[] = [
    { value: null, label: 'Any time' },
    { value: toIso(today), label: 'Available now' },
  ];
  for (let i = 1; i <= 3; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
    options.push({ value: toIso(d), label: `By ${formatIsoDate(toIso(d))}` });
  }
  return options;
}