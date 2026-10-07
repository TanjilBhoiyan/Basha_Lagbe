/** Normalises a Bangladeshi mobile number to its 10-digit form (e.g. "1712345678"). */
export function normalizeBdPhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith('880')) return digits.slice(3);
  if (digits.startsWith('0')) return digits.slice(1);
  return digits;
}

export function formatBdPhone(phone10: string): string {
  return `+880${phone10}`;
}

/** Shows only the last 3 digits, e.g. "+880 17XXXXX678". */
export function maskBdPhone(phone10: string): string {
  if (phone10.length < 5) return formatBdPhone(phone10);
  return `+880 ${phone10.slice(0, 2)}${'X'.repeat(phone10.length - 5)}${phone10.slice(-3)}`;
}

export function validateBdPhone(input: string): string | undefined {
  if (!input.trim()) return 'Phone number is required';
  if (!/^1[3-9]\d{8}$/.test(normalizeBdPhone(input))) {
    return 'Enter a valid Bangladeshi number, e.g. 1712345678';
  }
  return undefined;
}

export function validateEmail(input: string): string | undefined {
  if (!input.trim()) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.trim())) return 'Enter a valid email address';
  return undefined;
}

export function validateFullName(input: string): string | undefined {
  const name = input.trim();
  if (!name) return 'Full name is required';
  if (name.length < 3) return 'Name must be at least 3 characters';
  return undefined;
}

/** Login only checks presence; strength rules apply when creating a password. */
export function validatePasswordPresent(input: string): string | undefined {
  return input ? undefined : 'Password is required';
}

export function validateNewPassword(input: string): string | undefined {
  if (!input) return 'Password is required';
  if (input.length < 8) return 'Use at least 8 characters';
  if (!/[A-Za-z]/.test(input) || !/\d/.test(input) || !/[^A-Za-z0-9]/.test(input)) {
    return 'Use a mix of letters, numbers and symbols';
  }
  return undefined;
}