import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { geoCacheKey, isPlusCode } from '../common/geo.js';

/** One "suggested address" under the map pin. */
export type NearbyPlace = {
  id: string;
  name: string; // "Mohakhali TB Gate Mosque"
  address: string; // "TB Gate Rd, Dhaka 1212"
  latitude: number;
  longitude: number;
};

type GooglePlace = {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
};

const DEFAULT_URL = 'https://places.googleapis.com/v1/places:searchNearby';
const TIMEOUT_MS = 6000;
const MAX_RESULTS = 5;
const RADIUS_M = 150;
/** Only the fields we show: the cheaper the field list, the cheaper the call. */
const FIELD_MASK = 'places.id,places.displayName,places.formattedAddress,places.location';

const MAX_CACHE = 2000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
/** Safety cap so we stay inside Google's free monthly quota (~5,000 calls). */
const DEFAULT_DAILY_LIMIT = 150;

/** "QCH5+PJ4, TB Gate Rd, Dhaka 1212, Bangladesh" -> "TB Gate Rd, Dhaka 1212" */
function cleanAddress(address: string) {
  return address
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part && !isPlusCode(part))
    .filter((part) => part.toLowerCase() !== 'bangladesh')
    .join(', ');
}

/**
 * "Suggested addresses" near a pin (shops, buildings, landmarks) from Google Places API (New).
 * .env: GOOGLE_MAPS_SERVER_KEY (backend-only key), optional PLACES_DAILY_LIMIT (default 150).
 * No key, limit reached or Google down -> empty list; the picker still works without suggestions.
 */
@Injectable()
export class PlacesService {
  private readonly logger = new Logger(PlacesService.name);
  private readonly key?: string;
  private readonly url: string;
  private readonly dailyLimit: number;
  private readonly cache = new Map<string, { at: number; places: NearbyPlace[] }>();
  private day = '';
  private usedToday = 0;

  constructor(config: ConfigService) {
    this.key = config.get<string>('GOOGLE_MAPS_SERVER_KEY') || undefined;
    this.url = config.get<string>('GOOGLE_PLACES_URL', DEFAULT_URL);
    this.dailyLimit = Number(config.get<string>('PLACES_DAILY_LIMIT')) || DEFAULT_DAILY_LIMIT;
    if (!this.key) this.logger.warn('GOOGLE_MAPS_SERVER_KEY is missing: no suggested addresses.');
  }

  async nearby(lat: number, lng: number): Promise<NearbyPlace[]> {
    if (!this.key) return [];

    const key = geoCacheKey(lat, lng);
    const hit = this.cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.places;

    if (!this.takeFromDailyLimit()) return [];

    try {
      const places = await this.fetchNearby(lat, lng);
      if (this.cache.size >= MAX_CACHE) this.cache.delete(this.cache.keys().next().value!);
      this.cache.set(key, { at: Date.now(), places });
      return places;
    } catch (e) {
      // Not cached, so it is tried again next time.
      this.logger.warn(`Nearby places failed for ${key}: ${(e as Error).message}`);
      return [];
    }
  }

  /** false when today's Google calls are used up (resets at midnight, server time). */
  private takeFromDailyLimit() {
    const today = new Date().toDateString();
    if (today !== this.day) {
      this.day = today;
      this.usedToday = 0;
    }
    if (this.usedToday >= this.dailyLimit) {
      if (this.usedToday === this.dailyLimit) {
        this.logger.warn(`Daily Places limit (${this.dailyLimit}) reached: no suggestions until tomorrow.`);
        this.usedToday++; // log only once
      }
      return false;
    }
    this.usedToday++;
    return true;
  }

  private async fetchNearby(lat: number, lng: number): Promise<NearbyPlace[]> {
    const res = await fetch(this.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': this.key!,
        'X-Goog-FieldMask': FIELD_MASK,
      },
      body: JSON.stringify({
        maxResultCount: MAX_RESULTS,
        rankPreference: 'DISTANCE',
        languageCode: 'en',
        regionCode: 'bd',
        locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius: RADIUS_M } },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: { status?: string; message?: string } } | null;
      throw new Error(`google HTTP ${res.status} ${body?.error?.status ?? ''} ${body?.error?.message ?? ''}`.trim());
    }
    const data = (await res.json()) as { places?: GooglePlace[] };

    return (data.places ?? [])
      .filter((p) => p.displayName?.text && p.location)
      .map((p) => ({
        id: p.id,
        name: p.displayName!.text,
        address: cleanAddress(p.formattedAddress ?? ''),
        latitude: p.location!.latitude,
        longitude: p.location!.longitude,
      }));
  }
}