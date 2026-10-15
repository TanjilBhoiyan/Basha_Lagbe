const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "9:12 AM" */
export function formatChatTime(iso: string) {
  const d = new Date(iso);
  const h = d.getHours();
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(d.getMinutes()).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

/** Local day key, used to group messages: "2026-10-07" */
export function dayKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** "Today", "Yesterday", or "Mon, 5 Oct" */
export function dayLabel(iso: string, now = new Date()) {
  const d = new Date(iso);
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (dayKey(iso) === dayKey(now.toISOString())) return 'Today';
  if (dayKey(iso) === dayKey(yesterday.toISOString())) return 'Yesterday';
  const label = `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  return d.getFullYear() === now.getFullYear() ? label : `${label} ${d.getFullYear()}`;
}

/** Messages list: "10:42 AM" today, "Yesterday", "Mon" this week, else "12 Oct". */
export function formatListTime(iso: string, now = new Date()) {
  const d = new Date(iso);
  if (dayKey(iso) === dayKey(now.toISOString())) return formatChatTime(iso);
  const days = Math.floor((new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - d.getTime()) / 86400000);
  if (days < 1) return 'Yesterday';
  if (days < 6) return WEEKDAYS[d.getDay()];
  const label = `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  return d.getFullYear() === now.getFullYear() ? label : `${label} ${d.getFullYear()}`;
}