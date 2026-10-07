import type { SheetOption } from '@/components/ui';

export type PriceRange = { min?: number; max?: number } | null;
export type BedroomFilter = number | null;

export const PRICE_OPTIONS: SheetOption<PriceRange>[] = [
  { value: null, label: 'Any price' },
  { value: { max: 10000 }, label: 'Under ৳10,000' },
  { value: { min: 10000, max: 25000 }, label: '৳10,000 – ৳25,000' },
  { value: { min: 25000, max: 50000 }, label: '৳25,000 – ৳50,000' },
  { value: { min: 50000 }, label: 'Above ৳50,000' },
];

/** `4` means "4 or more". */
export const BEDROOM_OPTIONS: SheetOption<BedroomFilter>[] = [
  { value: null, label: 'Any' },
  { value: 1, label: '1 Bedroom' },
  { value: 2, label: '2 Bedrooms' },
  { value: 3, label: '3 Bedrooms' },
  { value: 4, label: '4+ Bedrooms' },
];

/** Short chip text, e.g. "৳10k–25k" or "3 Beds". */
export function priceChipLabel(range: PriceRange): string {
  if (!range) return 'Price';
  const k = (n: number) => `${n / 1000}k`;
  if (range.min && range.max) return `৳${k(range.min)}–${k(range.max)}`;
  if (range.max) return `< ৳${k(range.max)}`;
  return `৳${k(range.min ?? 0)}+`;
}

export function bedroomChipLabel(beds: BedroomFilter): string {
  if (beds === null) return 'Bedrooms';
  return beds >= 4 ? '4+ Beds' : `${beds} Bed${beds > 1 ? 's' : ''}`;
}