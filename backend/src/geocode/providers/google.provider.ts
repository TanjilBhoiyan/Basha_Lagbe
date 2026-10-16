import type { ConfigService } from '@nestjs/config';

import type { GeocodeProvider, PlaceName } from '../geocode.provider.js';

const DEFAULT_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
const TIMEOUT_MS = 6000;

type Component = { long_name: string; types: string[] };
type GeocodeResult = { types: string[]; address_components: Component[] };
type GeocodeResponse = { status: string; error_message?: string; results?: GeocodeResult[] };

/** "Dhaka District" -> "Dhaka", "Dhaka Division" -> "Dhaka" */
const clean = (s?: string) => s?.replace(/\s+(District|Division)$/i, '').trim() || undefined;

/** First component (in Google's order) that has one of these types. */
function pick(results: GeocodeResult[], ...types: string[]) {
  for (const type of types) {
    for (const r of results) {
      const c = r.address_components.find((x) => x.types.includes(type));
      if (c) return clean(c.long_name);
    }
  }
  return undefined;
}

/**
 * Google Geocoding: the area ("Mohakhali") and city ("Dhaka") for a point.
 * .env: GEOCODE_PROVIDER="google" and GOOGLE_MAPS_SERVER_KEY="..." (the backend-only key,
 * restricted to Geocoding API + Places API (New)). Free monthly quota, then paid per request:
 * https://developers.google.com/maps/billing-and-pricing/pricing
 */
export class GoogleProvider implements GeocodeProvider {
  private readonly url: string;
  private readonly key: string;

  constructor(config: ConfigService) {
    const key = config.get<string>('GOOGLE_MAPS_SERVER_KEY');
    if (!key) throw new Error('GEOCODE_PROVIDER is "google" but GOOGLE_MAPS_SERVER_KEY is missing in .env');
    this.key = key;
    this.url = config.get<string>('GOOGLE_GEOCODE_URL', DEFAULT_URL);
  }

  async reverse(lat: number, lng: number): Promise<PlaceName | null> {
    const params = new URLSearchParams({
      latlng: `${lat},${lng}`,
      language: 'en',
      region: 'bd',
      key: this.key,
    });

    const res = await fetch(`${this.url}?${params}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) throw new Error(`google HTTP ${res.status}`);
    const data = (await res.json()) as GeocodeResponse;

    if (data.status === 'ZERO_RESULTS') return null;
    if (data.status !== 'OK') throw new Error(`google ${data.status}: ${data.error_message ?? ''}`);

    // Plus codes ("QCH5+PWX") are not names people use.
    const results = (data.results ?? []).filter((r) => !r.types.includes('plus_code'));
    const area = pick(results, 'sublocality_level_1', 'sublocality', 'neighborhood', 'sublocality_level_2');
    const city = pick(results, 'locality', 'administrative_area_level_2', 'administrative_area_level_1');
    if (!area && !city) return null;
    return { name: area ?? city!, city: city ?? area! };
  }
}