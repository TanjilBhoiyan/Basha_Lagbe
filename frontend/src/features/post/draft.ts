import { HOME_CATEGORIES } from '@/features/home/categories';
import type { PropertyType, TenantType } from '@/types/property';

export const TITLE_MAX = 100;
export const ADDRESS_MAX = 200;
export const RENT_MIN = 1000;
export const RENT_MAX = 1000000;

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

/** Everything the owner fills in across the 4 steps (more fields come with steps 2–4). */
export type PropertyDraft = {
  title: string;
  type: PropertyType | null;
  rentalCategory: RentalCategory | null;
  /** Full address — never shown publicly; shared with tenants after a visit is confirmed. */
  address: string;
  monthlyRent: number | null;
};

export const EMPTY_DRAFT: PropertyDraft = {
  title: '',
  type: null,
  rentalCategory: null,
  address: '',
  monthlyRent: null,
};

export type DraftErrors = Partial<Record<keyof PropertyDraft, string>>;

export function validateBasicInfo(d: PropertyDraft): DraftErrors {
  const errors: DraftErrors = {};
  const title = d.title.trim();
  if (!title) errors.title = 'Please enter a title.';
  else if (title.length < 10) errors.title = 'Add a few more words, e.g. "2 Bed Flat in Mirpur".';

  if (!d.type) errors.type = 'Please select a property type.';
  if (!d.rentalCategory) errors.rentalCategory = 'Please select who can rent.';

  const address = d.address.trim();
  if (!address) errors.address = 'Please enter the address.';
  else if (address.length < 15) errors.address = 'Add road / house number and area.';

  if (d.monthlyRent === null) errors.monthlyRent = 'Please enter the monthly rent.';
  else if (d.monthlyRent < RENT_MIN) errors.monthlyRent = `Rent must be at least ৳${RENT_MIN}.`;
  else if (d.monthlyRent > RENT_MAX) errors.monthlyRent = 'This amount looks too high. Please check it.';

  return errors;
}

export const hasDraftContent = (d: PropertyDraft) =>
  Boolean(d.title || d.type || d.rentalCategory || d.address || d.monthlyRent);