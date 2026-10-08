/** Formats with Bangladeshi digit grouping, e.g. 125000 -> "1,25,000". */
export function formatBdNumber(value: number): string {
  const [int, dec] = Math.round(value).toString().split('.');
  const last3 = int.slice(-3);
  const rest = int.slice(0, -3);
  const grouped = rest ? `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${last3}` : last3;
  return dec ? `${grouped}.${dec}` : grouped;
}

/** "৳ 28,000" */
export function formatTaka(value: number): string {
  return `৳ ${formatBdNumber(value)}`;
}

/** "1 Bed", "3 Beds" */
export function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

/** 1 -> "1st Floor", 5 -> "5th Floor"; 0 -> "Ground Floor". */
export function floorLabel(floor: number): string {
  if (floor === 0) return 'Ground Floor';
  const mod100 = floor % 100;
  const suffix =
    mod100 >= 11 && mod100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[floor % 10] ?? 'th';
  return `${floor}${suffix} Floor`;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2023-01" -> "Jan 2023" */
export function formatYearMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}