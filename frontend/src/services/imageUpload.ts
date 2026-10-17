import * as FileSystem from 'expo-file-system/legacy';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Platform } from 'react-native';

import type { Result } from '@/types/auth';

import { API_URL } from './apiClient';
import { session } from './session';

const UPLOAD_TIMEOUT_MS = 60000;

/** A photo picked on the phone (expo-image-picker result). */
export type LocalPhoto = { uri: string; mimeType?: string | null };

type RawResponse = { status: number; body: string };

/** Longest side (px) we upload: listing photos stay sharp on any phone, profile photos are small. */
const MAX_SIDE: Record<string, number> = { '/uploads/avatar': 512 };
const DEFAULT_MAX_SIDE = 1600;
/** JPEG quality 0–1: 0.7 looks the same on a phone at a fraction of the size. */
const JPEG_QUALITY = 0.7;

/**
 * Makes the photo smaller before upload (a 4 MB camera photo becomes ~300 KB):
 * longest side at most `maxSide`, saved as JPEG. If that fails, the original is sent.
 */
async function shrink(photo: LocalPhoto, maxSide: number): Promise<{ uri: string; mimeType: string }> {
  try {
    const original = await ImageManipulator.manipulate(photo.uri).renderAsync();
    const context = ImageManipulator.manipulate(original);
    if (Math.max(original.width, original.height) > maxSide) {
      context.resize(original.width >= original.height ? { width: maxSide } : { height: maxSide });
    }
    const image = await context.renderAsync();
    const saved = await image.saveAsync({ compress: JPEG_QUALITY, format: SaveFormat.JPEG });
    return { uri: saved.uri, mimeType: 'image/jpeg' };
  } catch {
    return { uri: photo.uri, mimeType: photo.mimeType ?? 'image/jpeg' };
  }
}

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
 * Shrinks one photo, uploads it to an upload route (e.g. "/uploads/avatar") and returns its URL
 * (Cloudflare R2 link, or "/static/..." when the server has no R2 keys).
 * `label` names the photo in error messages, e.g. "Photo 2" or "Your photo".
 */
export async function uploadImage(path: string, photo: LocalPhoto, label = 'The photo'): Promise<Result<string>> {
  const file = await shrink(photo, MAX_SIDE[path] ?? DEFAULT_MAX_SIDE);
  const name = `photo.${file.mimeType.split('/')[1] ?? 'jpg'}`;
  try {
    const { status, body } = await sendFile(`${API_URL}${path}`, file.uri, file.mimeType, name);
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