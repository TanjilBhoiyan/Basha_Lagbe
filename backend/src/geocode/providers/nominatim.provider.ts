import type { ConfigService } from '@nestjs/config';

import type { GeocodeProvider, PlaceName } from '../geocode.provider.js';

const DEFAULT_URL = 'https://nominatim.openstreetmap.org/reverse';
const TIMEOUT_MS = 8000;
/** Nominatim's free service allows at most 1 request per second. */
const MIN_GAP_MS = 1100;

type NominatimAddress = Partial<
  Record<
    | 'neighbourhood' | 'suburb' | 'quarter' | 'city_district' | 'residential' | 'village' | 'road'
    | 'city' | 'town' | 'municipality' | 'county' | 'state_district' | 'state',
    string
  >
>;

/** "Dhaka District" -> "Dhaka", "Dhaka Division" -> "Dhaka" */
const clean = (s?: string) => s?.replace(/\s+(District|Division|City Corporation)$/i, '').trim() || undefined;

/**
 * OpenStreetMap's free place names (same data as our map).
 * .env: GEOCODE_PROVIDER="nominatim" (default). Optional NOMINATIM_EMAIL="you@example.com"
 * (OpenStreetMap asks heavy users to give a contact). Usage policy:
 * https://operations.osmfoundation.org/policies/nominatim/
 */
export class NominatimProvider implements GeocodeProvider {
  private readonly url: string;
  private readonly email?: string;
  /** Requests wait in line so we never send more than 1 per second. */
  private queue: Promise<unknown> = Promise.resolve();
  private lastAt = 0;

  constructor(config: ConfigService) {
    this.url = config.get<string>('NOMINATIM_URL', DEFAULT_URL);
    this.email = config.get<string>('NOMINATIM_EMAIL') || undefined;
  }

  reverse(lat: number, lng: number): Promise<PlaceName | null> {
    const run = this.queue.then(async () => {
      const wait = this.lastAt + MIN_GAP_MS - Date.now();
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      this.lastAt = Date.now();
      return this.fetchName(lat, lng);
    });
    this.queue = run.catch(() => undefined);
    return run;
  }

  private async fetchName(lat: number, lng: number): Promise<PlaceName | null> {
    const params = new URLSearchParams({
      format: 'jsonv2',
      lat: String(lat),
      lon: String(lng),
      zoom: '17', // small neighbourhoods (e.g. Mohakhali inside Gulshan)
      addressdetails: '1',
      'accept-language': 'en',
    });
    if (this.email) params.set('email', this.email);

    const res = await fetch(`${this.url}?${params}`, {
      headers: { 'User-Agent': 'BasaLagbe/1.0 (house rental app, Bangladesh)', Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`nominatim HTTP ${res.status}`);
    const data = (await res.json()) as { address?: NominatimAddress };
    const a = data.address;
    if (!a) return null;

    const city = clean(a.city ?? a.town ?? a.municipality ?? a.state_district ?? a.county ?? a.state);
    // Smallest named area first: neighbourhood (Mohakhali) before suburb (Gulshan).
    const name = clean(a.neighbourhood ?? a.quarter ?? a.suburb ?? a.residential ?? a.city_district ?? a.village ?? a.road);
    if (!name && !city) return null;
    return { name: name ?? city!, city: city ?? name! };
  }
}