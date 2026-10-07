/** Visit times offered to tenants (24-hour). Later the owner will set these. */
export const TIME_SLOTS = ['10:00', '12:00', '14:00', '16:00', '18:00'] as const;

/** How long one visit slot lasts. */
export const VISIT_DURATION_MIN = 60;

/** A slot must start at least this long from now to be bookable. */
const MIN_NOTICE_MS = 60 * 60 * 1000;

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export type VisitDay = { iso: string; weekday: string; day: number; month: string };

const pad = (n: number) => String(n).padStart(2, '0');

/** Local date -> "YYYY-MM-DD" (not toISOString, which shifts to UTC). */
export function toLocalIso(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Start of a visit slot as a local Date. */
export function slotStart(iso: string, time: string) {
  const [y, m, d] = iso.split('-').map(Number);
  const [h, min] = time.split(':').map(Number);
  return new Date(y, m - 1, d, h, min);
}

/** End of a visit slot as a local Date. */
export function slotEnd(iso: string, time: string) {
  return new Date(slotStart(iso, time).getTime() + VISIT_DURATION_MIN * 60_000);
}

export function isSlotAvailable(iso: string, time: string, now = new Date()) {
  return slotStart(iso, time).getTime() - now.getTime() >= MIN_NOTICE_MS;
}

/**
 * The next `count` days, starting today — or tomorrow if no slot is left today.
 */
export function upcomingDays(count: number, now = new Date()): VisitDay[] {
  const todayIso = toLocalIso(now);
  const startOffset = TIME_SLOTS.some((t) => isSlotAvailable(todayIso, t, now)) ? 0 : 1;
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + startOffset + i);
    return {
      iso: toLocalIso(d),
      weekday: WEEKDAYS[d.getDay()],
      day: d.getDate(),
      month: MONTHS[d.getMonth()],
    };
  });
}

/** "14:00" -> "2:00 PM" */
export function formatTimeSlot(time: string) {
  const [h, m] = time.split(':').map(Number);
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`;
}

/** "14:00" -> "2:00 PM – 3:00 PM" */
export function formatTimeRange(time: string) {
  const end = new Date(slotStart('2000-01-01', time).getTime() + VISIT_DURATION_MIN * 60_000);
  return `${formatTimeSlot(time)} – ${formatTimeSlot(`${end.getHours()}:${pad(end.getMinutes())}`)}`;
}

/** "2026-04-24" -> "Thu, 24 Apr" */
export function formatVisitDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${WEEKDAYS[date.getDay()]}, ${d} ${MONTHS[m - 1]}`;
}

/** "2026-04-24" -> "Thu, 24 Apr 2026" */
export function formatVisitDateLong(iso: string) {
  return `${formatVisitDate(iso)} ${iso.slice(0, 4)}`;
}