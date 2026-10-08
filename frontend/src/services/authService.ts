/**
 * Auth — talks to the NestJS backend (/auth/*).
 * Screens use the same functions as the old mock, so no screen had to change.
 *
 * While the backend runs with OTP_MOCK=true, every OTP is 123456.
 */
import type { LoginMethod, OtpPurpose, Result, User } from '@/types/auth';
import { normalizeBdPhone } from '@/utils/validation';

import { apiRequest } from './apiClient';
import { session } from './session';

/** Shown under the OTP boxes in development builds only. */
export const MOCK_OTP_CODE = '123456';
export const OTP_LENGTH = 6;
export const OTP_RESEND_SECONDS = 60;

type AuthResponse = { accessToken: string; user: User };

/**
 * Password reset happens over 3 screens. The short-lived reset token from
 * "verify OTP" is kept here in memory until "reset password" uses it.
 */
let resetToken: string | null = null;

async function startSession(data: AuthResponse): Promise<User> {
  await session.saveToken(data.accessToken);
  return data.user;
}

export const authService = {
  async login(method: LoginMethod, identifier: string, password: string): Promise<Result<User>> {
    const result = await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: {
        identifier: method === 'phone' ? normalizeBdPhone(identifier) : identifier.trim(),
        password,
      },
    });
    if (!result.ok) return result;
    return { ok: true, data: await startSession(result.data) };
  },

  async register(input: {
    fullName: string;
    phone: string;
    email: string;
    password: string;
  }): Promise<Result<{ phone: string }>> {
    return apiRequest<{ phone: string }>('/auth/register', {
      method: 'POST',
      body: { ...input, phone: normalizeBdPhone(input.phone) },
    });
  },

  /** Starts password reset. Returns the phone the OTP was sent to. */
  async requestPasswordReset(
    method: LoginMethod,
    identifier: string,
  ): Promise<Result<{ phone: string }>> {
    return apiRequest<{ phone: string }>('/auth/forgot-password', {
      method: 'POST',
      body: { identifier: method === 'phone' ? normalizeBdPhone(identifier) : identifier.trim() },
    });
  },

  async resendOtp(phone: string, purpose: OtpPurpose = 'register'): Promise<Result<null>> {
    const result = await apiRequest<{ phone: string }>('/auth/resend-otp', {
      method: 'POST',
      body: { phone, purpose },
    });
    return result.ok ? { ok: true, data: null } : result;
  },

  /** register: logs the user in and returns them. reset-password: returns null. */
  async verifyOtp(phone: string, code: string, purpose: OtpPurpose): Promise<Result<User | null>> {
    const result = await apiRequest<AuthResponse | { resetToken: string }>('/auth/verify-otp', {
      method: 'POST',
      body: { phone, code, purpose },
    });
    if (!result.ok) return result;

    if ('resetToken' in result.data) {
      resetToken = result.data.resetToken;
      return { ok: true, data: null };
    }
    return { ok: true, data: await startSession(result.data) };
  },

  async resetPassword(_phone: string, newPassword: string): Promise<Result<null>> {
    if (!resetToken) {
      return { ok: false, error: 'This reset session has expired. Please start again.' };
    }
    const result = await apiRequest<{ success: true }>('/auth/reset-password', {
      method: 'POST',
      body: { resetToken, newPassword },
    });
    if (!result.ok) return result;
    resetToken = null;
    return { ok: true, data: null };
  },

  /** The logged-in user from the server (also checks the token is still valid). */
  async me(): Promise<Result<User>> {
    return apiRequest<User>('/auth/me', { auth: true });
  },
};