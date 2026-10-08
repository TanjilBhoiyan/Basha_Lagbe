/** Bangladeshi mobile number rules — kept in sync with frontend/src/utils/validation.ts. */

/** "+8801712345678", "01712345678", "1712345678" -> "1712345678" */
export function normalizeBdPhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith('880')) return digits.slice(3);
  if (digits.startsWith('0')) return digits.slice(1);
  return digits;
}

/** 10 digits, starting with 13–19 (all BD mobile operators). */
export const BD_PHONE_REGEX = /^1[3-9]\d{8}$/;

export function isBdPhone(input: string): boolean {
  return BD_PHONE_REGEX.test(normalizeBdPhone(input));
}