import type { SheetOption } from '@/components/ui';
import type { PropertyFilters } from '@/features/filters/filters';

export type PriceRange = Pick<PropertyFilters, 'minRent' | 'maxRent'>;

export const PRICE_OPTIONS: SheetOption<PriceRange>[] = [
  { value: { minRent: 0, maxRent: null }, label: 'Any price' },
  { value: { minRent: 0, maxRent: 10000 }, label: 'Under ৳10,000' },
  { value: { minRent: 10000, maxRent: 25000 }, label: '৳10,000 – ৳25,000' },
  { value: { minRent: 25000, maxRent: 50000 }, label: '৳25,000 – ৳50,000' },
  { value: { minRent: 50000, maxRent: null }, label: 'Above ৳50,000' },
];

/** `4` means "4 or more". */
export const BEDROOM_OPTIONS: SheetOption<number | null>[] = [
  { value: null, label: 'Any' },
  { value: 1, label: '1 Bedroom' },
  { value: 2, label: '2 Bedrooms' },
  { value: 3, label: '3 Bedrooms' },
  { value: 4, label: '4+ Bedrooms' },
];

/** Finds the preset matching the current range, so the sheet can tick it. */
export function matchPricePreset(range: PriceRange): PriceRange | undefined {
  return PRICE_OPTIONS.find(
    (o) => o.value.minRent === range.minRent && o.value.maxRent === range.maxRent,
  )?.value;
}

const k = (n: number) => (n >= 1000 ? `${n / 1000}k` : `${n}`);

/** Short chip text, e.g. "৳10k–25k". */
export function priceChipLabel({ minRent, maxRent }: PriceRange): string {
  if (minRent === 0 && maxRent === null) return 'Price';
  if (maxRent === null) return `৳${k(minRent)}+`;
  if (minRent === 0) return `< ৳${k(maxRent)}`;
  return `৳${k(minRent)}–${k(maxRent)}`;
}

export function bedroomChipLabel(beds: number | null): string {
  if (beds === null) return 'Bedrooms';
  return beds >= 4 ? '4+ Beds' : `${beds} Bed${beds > 1 ? 's' : ''}`;
}