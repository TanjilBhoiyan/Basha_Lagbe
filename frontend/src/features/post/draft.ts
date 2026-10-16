import { HOME_CATEGORIES } from '@/features/home/categories';
import type { Amenity, Facing, Furnishing, Property, PropertyType, TenantType } from '@/types/property';
import { floorLabel } from '@/utils/format';

export const TITLE_MAX = 100;
export const ADDRESS_MAX = 200;
export const AREA_MAX = 60;
export const DESCRIPTION_MIN = 30;
export const DESCRIPTION_MAX = 1000;
export const RENT_MIN = 1000;
export const RENT_MAX = 1000000;
export const MAX_PHOTOS = 10;

/** Who the owner wants to rent to. Mapped to `tenantTypes` when the listing is published. */
export type RentalCategory =
  | 'family'
  | 'bachelor-male'
  | 'bachelor-female'
  | 'student'
  | 'office'
  | 'anyone';

export const RENTAL_CATEGORY_OPTIONS: { value: RentalCategory; label: string; tenants: TenantType[] }[] = [
  { value: 'family', label: 'Family', tenants: ['family'] },
  { value: 'bachelor-male', label: 'Bachelor (Male)', tenants: ['bachelor-male'] },
  { value: 'bachelor-female', label: 'Bachelor (Female)', tenants: ['bachelor-female'] },
  { value: 'student', label: 'Students', tenants: ['student'] },
  { value: 'office', label: 'Office / Commercial', tenants: ['professional'] },
  {
    value: 'anyone',
    label: 'Anyone',
    tenants: ['family', 'bachelor-male', 'bachelor-female', 'student', 'professional'],
  },
];

export const PROPERTY_TYPE_OPTIONS = HOME_CATEGORIES.filter(
  (c): c is typeof c & { type: PropertyType } => c.type !== null,
).map((c) => ({ value: c.type, label: c.label }));

export const FACING_OPTIONS: { value: Facing; label: string }[] = [
  { value: 'south', label: 'South Facing' },
  { value: 'south-east', label: 'South-East Facing' },
  { value: 'south-west', label: 'South-West Facing' },
  { value: 'east', label: 'East Facing' },
  { value: 'west', label: 'West Facing' },
  { value: 'north', label: 'North Facing' },
  { value: 'north-east', label: 'North-East Facing' },
  { value: 'north-west', label: 'North-West Facing' },
];

/** 0 = ground floor ... 30th floor. */
export const FLOOR_OPTIONS = Array.from({ length: 31 }, (_, n) => ({ value: n, label: floorLabel(n) }));
export const TOTAL_FLOOR_OPTIONS = Array.from({ length: 30 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1} ${i === 0 ? 'floor' : 'floors'} building`,
}));

/** Offices and shops don't have bedrooms. */
export const hasBedrooms = (type: PropertyType | null) => type !== 'office' && type !== 'shop';

/**
 * A photo in the form. New photos from the phone are uploaded when the owner submits;
 * photos already on the server (when editing) keep their `remoteUrl` and aren't uploaded again.
 */
export type DraftPhoto = { uri: string; mimeType?: string; remoteUrl?: string };

/** Everything the owner fills in across the 4 steps. Saved on the phone as a draft. */
export type PropertyDraft = {
  // Step 1 — Basic Info
  title: string;
  type: PropertyType | null;
  rentalCategory: RentalCategory | null;
  /** Area name, filled from the pin and editable, e.g. "Mohakhali". */
  areaName: string;
  /** Exact spot of the building, pinned on the map (only the owner sees it exactly). */
  latitude: number | null;
  longitude: number | null;
  /** Name of the pinned spot, e.g. "GP Chha Road, Mohakhali". */
  pinLabel: string;
  /** Full address — never shown publicly. */
  address: string;
  monthlyRent: number | null;
  // Step 2 — Property Details
  bedrooms: number | null;
  bathrooms: number | null;
  sizeSqft: number | null;
  floorNumber: number | null;
  totalFloors: number | null;
  facing: Facing | null;
  furnishing: Furnishing | null;
  /** "YYYY-MM-DD" */
  availableFrom: string | null;
  negotiable: boolean;
  advanceMonths: number;
  serviceCharge: number | null;
  utilityCost: 'included' | 'separate';
  minStayMonths: number;
  description: string;
  // Step 3 — Photos
  photos: DraftPhoto[];
  amenities: Amenity[];
};

export const EMPTY_DRAFT: PropertyDraft = {
  title: '',
  type: null,
  rentalCategory: null,
  areaName: '',
  latitude: null,
  longitude: null,
  pinLabel: '',
  address: '',
  monthlyRent: null,
  bedrooms: null,
  bathrooms: null,
  sizeSqft: null,
  floorNumber: null,
  totalFloors: null,
  facing: null,
  furnishing: null,
  availableFrom: null,
  negotiable: false,
  advanceMonths: 2,
  serviceCharge: null,
  utilityCost: 'separate',
  minStayMonths: 0,
  description: '',
  photos: [],
  amenities: [],
};

export type DraftErrors = Partial<Record<keyof PropertyDraft, string>>;

export function validateBasicInfo(d: PropertyDraft): DraftErrors {
  const errors: DraftErrors = {};
  const title = d.title.trim();
  if (!title) errors.title = 'Please enter a title.';
  else if (title.length < 10) errors.title = 'Add a few more words, e.g. "2 Bed Flat in Mirpur".';

  if (!d.type) errors.type = 'Please select a property type.';
  if (!d.rentalCategory) errors.rentalCategory = 'Please select who can rent.';
  if (d.latitude === null || d.longitude === null) errors.latitude = 'Please pin the property on the map.';
  const area = d.areaName.trim();
  if (!area) errors.areaName = 'Please enter the area, e.g. Mohakhali.';
  else if (area.length < 2) errors.areaName = 'Area name is too short.';

  const address = d.address.trim();
  if (!address) errors.address = 'Please enter the address.';
  else if (address.length < 15) errors.address = 'Add road / house number and area.';

  if (d.monthlyRent === null) errors.monthlyRent = 'Please enter the monthly rent.';
  else if (d.monthlyRent < RENT_MIN) errors.monthlyRent = `Rent must be at least ৳${RENT_MIN}.`;
  else if (d.monthlyRent > RENT_MAX) errors.monthlyRent = 'This amount looks too high. Please check it.';

  return errors;
}

export function validateDetails(d: PropertyDraft): DraftErrors {
  const errors: DraftErrors = {};
  if (!d.type) errors.type = 'Please select a property type.';
  if (hasBedrooms(d.type) && !d.bedrooms) errors.bedrooms = 'Please select bedrooms.';
  if (d.bathrooms === null) errors.bathrooms = 'Please select bathrooms.';

  if (d.sizeSqft === null) errors.sizeSqft = 'Please enter the size.';
  else if (d.sizeSqft < 50) errors.sizeSqft = 'Size looks too small. Please check it.';
  else if (d.sizeSqft > 100000) errors.sizeSqft = 'Size looks too big. Please check it.';

  if (d.floorNumber === null) errors.floorNumber = 'Please select the floor.';
  if (d.totalFloors === null) errors.totalFloors = 'Please select total floors.';
  else if (d.floorNumber !== null && d.floorNumber > d.totalFloors) {
    errors.floorNumber = 'Floor can’t be higher than total floors.';
  }

  if (!d.furnishing) errors.furnishing = 'Please select furnishing.';
  if (!d.availableFrom) errors.availableFrom = 'Please select when it’s available.';

  const description = d.description.trim();
  if (description.length < DESCRIPTION_MIN) {
    errors.description = `Write at least ${DESCRIPTION_MIN} characters about the property.`;
  }
  return errors;
}

export function validatePhotos(d: PropertyDraft): DraftErrors {
  return d.photos.length ? {} : { photos: 'Please add at least one photo.' };
}

/** Errors for one step (0-based). The last step (Preview) checks everything. */
export function validateStep(step: number, d: PropertyDraft): DraftErrors {
  if (step === 0) return validateBasicInfo(d);
  if (step === 1) return validateDetails(d);
  if (step === 2) return validatePhotos(d);
  return {};
}

/** First step that still has a problem, or -1 when everything is filled in. */
export function firstInvalidStep(d: PropertyDraft): number {
  return [0, 1, 2].find((s) => Object.keys(validateStep(s, d)).length > 0) ?? -1;
}

/** Turns a saved listing back into a form draft (Edit Property). */
export function draftFromProperty(
  p: Omit<Property, 'images' | 'owner' | 'isVerified'> & { address: string },
  photos: DraftPhoto[],
): PropertyDraft {
  const sameTenants = (list: TenantType[]) =>
    list.length === p.tenantTypes.length && list.every((t) => p.tenantTypes.includes(t));
  // A listing for several tenant types was posted as "Anyone".
  const rentalCategory =
    RENTAL_CATEGORY_OPTIONS.find((o) => sameTenants(o.tenants))?.value ?? (p.tenantTypes.length > 1 ? 'anyone' : null);

  return {
    title: p.title,
    type: p.type,
    rentalCategory,
    // "Mirpur, Dhaka" -> "Mirpur"
    areaName: p.areaLabel.split(',')[0].trim(),
    latitude: p.latitude,
    longitude: p.longitude,
    pinLabel: '',
    address: p.address,
    monthlyRent: p.monthlyRent,
    bedrooms: hasBedrooms(p.type) ? Math.min(p.bedrooms, 4) : 0,
    bathrooms: Math.min(Math.max(p.bathrooms, 1), 4),
    sizeSqft: p.sizeSqft,
    floorNumber: p.floorNumber,
    totalFloors: p.totalFloors,
    facing: p.facing ?? null,
    furnishing: p.furnishing,
    availableFrom: p.availableFrom,
    negotiable: p.negotiable,
    advanceMonths: p.advanceMonths,
    serviceCharge: p.serviceCharge,
    utilityCost: p.utilityCost,
    minStayMonths: p.minStayMonths,
    description: p.description,
    photos,
    amenities: p.amenities,
  };
}

export const hasDraftContent = (d: PropertyDraft) =>
  Boolean(d.title || d.type || d.rentalCategory || d.address || d.monthlyRent || d.photos.length);

/** "Right away" + the 1st of the next 3 months (rent usually starts on the 1st). */
export function availableFromOptions(today = new Date()): { value: string; label: string }[] {
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const options = [{ value: iso(today), label: 'Right away' }];
  for (let i = 1; i <= 3; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
    options.push({ value: iso(d), label: formatDraftDate(iso(d)) });
  }
  return options;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-11-01" -> "1 Nov 2026" */
export function formatDraftDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}