import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

import type { Result } from '@/types/auth';

import { API_URL } from './apiClient';
import { session } from './session';

const UPLOAD_TIMEOUT_MS = 60000;

/** A photo picked on the phone (expo-image-picker result). */
export type LocalPhoto = { uri: string; mimeType?: string | null };

type RawResponse = { status: number; body: string };

/**
 * Sends the file as multipart "file".
 * Phones: expo-file-system streams the file from disk (fetch + FormData can't send local files here).
 * Web (testing only): a normal fetch with a Blob.
 */
async function sendFile(url: string, uri: string, mimeType: string, name: string): Promise<RawResponse> {
  const token = await session.getToken();
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  if (Platform.OS !== 'web') {
    const res = await FileSystem.uploadAsync(url, uri, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: 'file',
      mimeType,
      headers,
    });
    return { status: res.status, body: res.body };
  }

  const form = new FormData();
  form.append('file', await (await fetch(uri)).blob(), name);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);
  try {
    const res = await fetch(url, { method: 'POST', headers, body: form, signal: controller.signal });
    return { status: res.status, body: await res.text() };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Uploads one photo to an upload route (e.g. "/uploads/avatar") and returns its "/static/..." URL.
 * `label` names the photo in error messages, e.g. "Photo 2" or "Your photo".
 */
export async function uploadImage(path: string, photo: LocalPhoto, label = 'The photo'): Promise<Result<string>> {
  const type = photo.mimeType ?? 'image/jpeg';
  const name = `photo.${type.split('/')[1] ?? 'jpg'}`;
  try {
    const { status, body } = await sendFile(`${API_URL}${path}`, photo.uri, type, name);
    let data: { url?: string; message?: string | string[] } | null = null;
    try {
      data = body ? JSON.parse(body) : null;
    } catch {
      // not JSON
    }
    if (status >= 200 && status < 300 && data?.url) return { ok: true, data: data.url };
    if (status === 413) return { ok: false, error: `${label} is too large (max 5 MB).` };
    if (status === 401) return { ok: false, error: 'Your session has expired. Please log in again.' };
    const message = Array.isArray(data?.message) ? data?.message[0] : data?.message;
    return { ok: false, error: message ?? `${label} could not be uploaded.` };
  } catch {
    return { ok: false, error: 'Photo upload failed. Check your internet connection and try again.' };
  }
}