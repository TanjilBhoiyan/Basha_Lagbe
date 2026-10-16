import { Logger } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';

import type { GeocodeProvider, PlaceName } from '../geocode.provider.js';
import { NominatimProvider } from './nominatim.provider.js';

const DEFAULT_URL = 'https://api.geoapify.com/v2/places';
const TIMEOUT_MS = 5000;
/** Look for a named area (Mohakhali, Banani...) this close to the point. */
const RADIUS_M = 2000;
/** Big, well-known areas first; small ones only if no big one is near. */
const AREA_TYPES = ['populated_place.suburb', 'populated_place.quarter', 'populated_place.neighbourhood'];

type Feature = {
  properties: {
    name?: string;
    suburb?: string;
    city?: string;
    distance?: number;
    categories?: string[];
    name_international?: { en?: string };
  };
};

/** English name if there is one ("Mohakhali"), otherwise the local one ("মহাখালী"). */
const nameOf = (f: Feature) =>
  (f.properties.name_international?.en ?? f.properties.suburb ?? f.properties.name)?.trim() || undefined;

/**
 * Area names from Geoapify (OpenStreetMap data, fast servers, free daily quota, no card).
 * Picks the nearest "suburb" point around the pin (Mohakhali for TB Gate, Banani for Banani),
 * else the nearest quarter/neighbourhood. Nothing found or Geoapify down -> Nominatim.
 * .env: GEOCODE_PROVIDER="geoapify" and GEOAPIFY_API_KEY="...".
 * Data is © OpenStreetMap contributors: the app must show that credit.
 */
export class GeoapifyProvider implements GeocodeProvider {
  private readonly logger = new Logger(GeoapifyProvider.name);
  private readonly url: string;
  private readonly key: string;
  private readonly fallback: NominatimProvider;

  constructor(config: ConfigService) {
    const key = config.get<string>('GEOAPIFY_API_KEY');
    if (!key) throw new Error('GEOCODE_PROVIDER is "geoapify" but GEOAPIFY_API_KEY is missing in .env');
    this.key = key;
    this.url = config.get<string>('GEOAPIFY_URL', DEFAULT_URL);
    this.fallback = new NominatimProvider(config);
  }

  async reverse(lat: number, lng: number): Promise<PlaceName | null> {
    try {
      const place = await this.fetchArea(lat, lng);
      if (place) return place;
    } catch (e) {
      this.logger.warn(`Geoapify failed, using Nominatim: ${(e as Error).message}`);
    }
    return this.fallback.reverse(lat, lng);
  }

  private async fetchArea(lat: number, lng: number): Promise<PlaceName | null> {
    const params = new URLSearchParams({
      categories: AREA_TYPES.join(','),
      filter: `circle:${lng},${lat},${RADIUS_M}`, // Geoapify wants lon first
      bias: `proximity:${lng},${lat}`,
      limit: '20',
      lang: 'en',
      apiKey: this.key,
    });

    const res = await fetch(`${this.url}?${params}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) throw new Error(`geoapify HTTP ${res.status}`);
    const data = (await res.json()) as { features?: Feature[] };
    const features = (data.features ?? []).filter((f) => nameOf(f));

    // Nearest suburb wins; if none, nearest quarter, then neighbourhood.
    for (const type of AREA_TYPES) {
      const best = features
        .filter((f) => f.properties.categories?.includes(type))
        .sort((a, b) => (a.properties.distance ?? Infinity) - (b.properties.distance ?? Infinity))[0];
      if (best) {
        const area = nameOf(best)!;
        return { name: area, city: best.properties.city?.trim() || area };
      }
    }
    return null; // nothing close by: Nominatim decides
  }
}