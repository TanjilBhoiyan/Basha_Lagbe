import type { Result } from '@/types/auth';

import { session } from './session';

/**
 * Backend address. Set EXPO_PUBLIC_API_URL in frontend/.env
 * Android emulator: http://10.0.2.2:3000 (10.0.2.2 = your PC from inside the emulator)
 */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3000').replace(/\/$/, '');

const TIMEOUT_MS = 15000;
/**
 * Photos come from the API as "/static/..." (served by our backend) or a full
 * https URL (cloud storage later). Turns either into an <Image source>.
 */
export function apiImage(url: string): { uri: string } {
  return { uri: /^https?:\/\//.test(url) ? url : `${API_URL}${url}` };
}
type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Send the saved login token (Authorization: Bearer ...). */
  auth?: boolean;
};

/** NestJS errors look like { message: string | string[], statusCode }. Show the first message. */
function errorMessage(data: unknown, status: number): string {
  const message = (data as { message?: unknown } | null)?.message;
  if (Array.isArray(message) && typeof message[0] === 'string') return message[0];
  if (typeof message === 'string') return message;
  return status >= 500 ? 'Something went wrong on our side. Please try again.' : `Request failed (${status}).`;
}

/** Every API call goes through here, so screens always get a Result and never a thrown error. */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<Result<T>> {
  const { method = 'GET', body, auth = false } = options;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = await session.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await response.text();
    const data: unknown = text ? JSON.parse(text) : null;

    if (!response.ok) {
      // Token expired or invalid: forget it so the app asks for login again.
      if (response.status === 401 && auth) await session.clear();
      return { ok: false, error: errorMessage(data, response.status) };
    }
    return { ok: true, data: data as T };
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      return { ok: false, error: 'The server is taking too long. Please try again.' };
    }
    return { ok: false, error: 'Cannot reach the server. Check your internet connection.' };
  } finally {
    clearTimeout(timer);
  }
}