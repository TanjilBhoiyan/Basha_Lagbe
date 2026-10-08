import type { SheetOption } from '@/components/ui';
import type { PropertySort } from '@/services/propertyService';

export const SORT_OPTIONS: SheetOption<PropertySort>[] = [
  { value: 'recommended', label: 'Popular' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
];

export function sortLabel(sort: PropertySort) {
  return SORT_OPTIONS.find((o) => o.value === sort)?.label ?? 'Popular';
}