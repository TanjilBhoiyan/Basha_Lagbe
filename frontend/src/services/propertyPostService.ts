import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

import { hasBedrooms, RENTAL_CATEGORY_OPTIONS, type DraftPhoto, type PropertyDraft } from '@/features/post/draft';
import type { Result } from '@/types/auth';

import { API_URL, apiRequest } from './apiClient';
import { session } from './session';

const UPLOAD_URL = `${API_URL}/uploads/property-image`;
const UPLOAD_TIMEOUT_MS = 60000;

type RawResponse = { status: number; body: string };

/**
 * Sends the file as multipart "file".
 * Phones: expo-file-system streams the file from disk (fetch + FormData can't send local files here).
 * Web (testing only): a normal fetch with a Blob.
 */
async function sendFile(uri: string, mimeType: string, name: string, token: string | null): Promise<RawResponse> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  if (Platform.OS !== 'web') {
    const res = await FileSystem.uploadAsync(UPLOAD_URL, uri, {
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
    const res = await fetch(UPLOAD_URL, { method: 'POST', headers, body: form, signal: controller.signal });
    return { status: res.status, body: await res.text() };
  } finally {
    clearTimeout(timer);
  }
}

/** Uploads one photo and returns its "/static/..." URL. */
async function uploadPhoto(photo: DraftPhoto, index: number): Promise<Result<string>> {
  const type = photo.mimeType ?? 'image/jpeg';
  const name = `photo-${index + 1}.${type.split('/')[1] ?? 'jpg'}`;
  try {
    const { status, body } = await sendFile(photo.uri, type, name, await session.getToken());
    let data: { url?: string; message?: string | string[] } | null = null;
    try {
      data = body ? JSON.parse(body) : null;
    } catch {
      // not JSON
    }
    if (status >= 200 && status < 300 && data?.url) return { ok: true, data: data.url };
    if (status === 413) return { ok: false, error: `Photo ${index + 1} is too large (max 5 MB).` };
    if (status === 401) return { ok: false, error: 'Your session has expired. Please log in again.' };
    const message = Array.isArray(data?.message) ? data?.message[0] : data?.message;
    return { ok: false, error: message ?? `Photo ${index + 1} could not be uploaded.` };
  } catch {
    return { ok: false, error: 'Photo upload failed. Check your internet connection and try again.' };
  }
}

/** Uploads the new photos (in order) and returns every photo's server URL. */
async function photoUrls(
  photos: DraftPhoto[],
  onProgress?: (done: number, total: number) => void,
): Promise<Result<string[]>> {
  const urls: string[] = [];
  for (const [i, photo] of photos.entries()) {
    onProgress?.(i, photos.length);
    if (photo.remoteUrl) {
      urls.push(photo.remoteUrl); // already on the server (editing)
      continue;
    }
    const uploaded = await uploadPhoto(photo, i);
    if (!uploaded.ok) return uploaded;
    urls.push(uploaded.data);
  }
  onProgress?.(photos.length, photos.length);
  return { ok: true, data: urls };
}

/** Form draft -> request body for POST /properties and PUT /properties/:id. */
function toBody(d: PropertyDraft, images: string[]) {
  return {
    title: d.title.trim(),
    type: d.type,
    tenantTypes: RENTAL_CATEGORY_OPTIONS.find((o) => o.value === d.rentalCategory)?.tenants ?? [],
    locationId: d.locationId,
    address: d.address.trim(),
    monthlyRent: d.monthlyRent,
    negotiable: d.negotiable,
    advanceMonths: d.advanceMonths,
    serviceCharge: d.serviceCharge ?? 0,
    utilityCost: d.utilityCost,
    minStayMonths: d.minStayMonths,
    bedrooms: hasBedrooms(d.type) ? d.bedrooms : 0,
    bathrooms: d.bathrooms,
    sizeSqft: d.sizeSqft,
    floorNumber: d.floorNumber,
    totalFloors: d.totalFloors,
    facing: d.facing ?? undefined,
    furnishing: d.furnishing,
    amenities: d.amenities,
    availableFrom: d.availableFrom,
    description: d.description.trim(),
    images,
  };
}

/** Posts or saves the Add/Edit Property form: uploads new photos, then sends the form. */
export const propertyPostService = {
  /** New listing. */
  async submit(d: PropertyDraft, onProgress?: (done: number, total: number) => void): Promise<Result<{ id: string }>> {
    const images = await photoUrls(d.photos, onProgress);
    if (!images.ok) return images;
    return apiRequest<{ id: string }>('/properties', { method: 'POST', auth: true, body: toBody(d, images.data) });
  },

  /** Save changes to an existing listing. */
  async update(
    propertyId: string,
    d: PropertyDraft,
    onProgress?: (done: number, total: number) => void,
  ): Promise<Result<{ id: string }>> {
    const images = await photoUrls(d.photos, onProgress);
    if (!images.ok) return images;
    return apiRequest<{ id: string }>(`/properties/${encodeURIComponent(propertyId)}`, {
      method: 'PUT',
      auth: true,
      body: toBody(d, images.data),
    });
  },
};