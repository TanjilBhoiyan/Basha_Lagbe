/**
 * MOCK auth service — no backend yet.
 * Screens only talk to these functions, so swapping in real API calls later
 * will not require any screen changes.
 *
 * Test account:  phone 1712345678 / email test@bashalagbe.com / password Test@1234
 * OTP code:      123456
 */
import type { LoginMethod, OtpPurpose, Result, User } from '@/types/auth';
import { normalizeBdPhone } from '@/utils/validation';

export const MOCK_OTP_CODE = '123456';
export const OTP_LENGTH = 6;
export const OTP_RESEND_SECONDS = 60;
export const OTP_MAX_ATTEMPTS = 5;

type StoredUser = User & { password: string };

const users: StoredUser[] = [
  {
    id: 'u_test',
    fullName: 'Test User',
    phone: '1712345678',
    email: 'test@bashalagbe.com',
    phoneVerified: true,
    password: 'Test@1234',
  },
];

/** Registrations waiting for OTP, keyed by phone. */
const pendingRegistrations = new Map<string, StoredUser>();
const otpAttempts = new Map<string, number>();

const delay = (ms = 800) => new Promise((resolve) => setTimeout(resolve, ms));

function toPublicUser({ password: _password, ...user }: StoredUser): User {
  return user;
}

function findUser(method: LoginMethod, identifier: string) {
  return method === 'phone'
    ? users.find((u) => u.phone === normalizeBdPhone(identifier))
    : users.find((u) => u.email.toLowerCase() === identifier.trim().toLowerCase());
}

export const authService = {
  async login(method: LoginMethod, identifier: string, password: string): Promise<Result<User>> {
    await delay();
    const user = findUser(method, identifier);
    if (!user || user.password !== password) {
      return { ok: false, error: 'Incorrect phone/email or password.' };
    }
    return { ok: true, data: toPublicUser(user) };
  },

  async register(input: {
    fullName: string;
    phone: string;
    email: string;
    password: string;
  }): Promise<Result<{ phone: string }>> {
    await delay();
    const phone = normalizeBdPhone(input.phone);
    const email = input.email.trim().toLowerCase();
    if (users.some((u) => u.phone === phone)) {
      return { ok: false, error: 'An account with this phone number already exists.' };
    }
    if (users.some((u) => u.email === email)) {
      return { ok: false, error: 'An account with this email already exists.' };
    }
    pendingRegistrations.set(phone, {
      id: `u_${Date.now()}`,
      fullName: input.fullName.trim(),
      phone,
      email,
      phoneVerified: false,
      password: input.password,
    });
    otpAttempts.set(phone, 0);
    return { ok: true, data: { phone } };
  },

  /** Starts password reset. Returns the phone the OTP was sent to. */
  async requestPasswordReset(
    method: LoginMethod,
    identifier: string,
  ): Promise<Result<{ phone: string }>> {
    await delay();
    const user = findUser(method, identifier);
    if (!user) {
      return { ok: false, error: 'No account found with these details.' };
    }
    otpAttempts.set(user.phone, 0);
    return { ok: true, data: { phone: user.phone } };
  },

  async resendOtp(phone: string): Promise<Result<null>> {
    await delay(500);
    // A fresh code gives the user a fresh set of attempts.
    otpAttempts.set(phone, 0);
    return { ok: true, data: null };
  },

  async verifyOtp(phone: string, code: string, purpose: OtpPurpose): Promise<Result<User | null>> {
    await delay();
    const attempts = (otpAttempts.get(phone) ?? 0) + 1;
    otpAttempts.set(phone, attempts);

    if (attempts > OTP_MAX_ATTEMPTS) {
      return { ok: false, error: 'Too many attempts. Please request a new code.' };
    }
    if (code !== MOCK_OTP_CODE) {
      const left = OTP_MAX_ATTEMPTS - attempts;
      return {
        ok: false,
        error: left > 0 ? `Incorrect code. ${left} attempt(s) left.` : 'Too many attempts. Please request a new code.',
      };
    }

    otpAttempts.delete(phone);
    if (purpose === 'register') {
      const pending = pendingRegistrations.get(phone);
      if (!pending) return { ok: false, error: 'Registration expired. Please register again.' };
      pendingRegistrations.delete(phone);
      const user = { ...pending, phoneVerified: true };
      users.push(user);
      return { ok: true, data: toPublicUser(user) };
    }
    return { ok: true, data: null };
  },

  async resetPassword(phone: string, newPassword: string): Promise<Result<null>> {
    await delay();
    const user = users.find((u) => u.phone === phone);
    if (!user) return { ok: false, error: 'Account not found.' };
    user.password = newPassword;
    return { ok: true, data: null };
  },
};