import { hasBedrooms, RENTAL_CATEGORY_OPTIONS, type DraftPhoto, type PropertyDraft } from '@/features/post/draft';
import type { Result } from '@/types/auth';

import { apiRequest } from './apiClient';
import { uploadImage } from './imageUpload';

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
    const uploaded = await uploadImage('/uploads/property-image', photo, `Photo ${i + 1}`);
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