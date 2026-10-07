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