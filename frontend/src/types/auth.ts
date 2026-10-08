export type User = {
  id: string;
  fullName: string;
  /** 10-digit Bangladeshi number without +880, e.g. "1712345678". */
  phone: string;
  email: string;
  phoneVerified: boolean;
};

export type OtpPurpose = 'register' | 'reset-password';

export type LoginMethod = 'phone' | 'email';

/** Result type used by every service call, so screens handle success and failure the same way. */
export type Result<T> = { ok: true; data: T } | { ok: false; error: string };