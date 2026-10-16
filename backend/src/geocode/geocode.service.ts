import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { GeocodeProvider, PlaceName } from './geocode.provider.js';
import { NominatimProvider } from './providers/nominatim.provider.js';
import { OverpassProvider } from './providers/overpass.provider.js';

/**
 * All place-name services we can use. GEOCODE_PROVIDER in .env picks one (default "overpass").
 * New service (e.g. Google, LocationIQ): make a file in ./providers, then add one line below.
 */
const PROVIDERS: Record<string, new (config: ConfigService) => GeocodeProvider> = {
  overpass: OverpassProvider, // nearest area name (Mohakhali), Nominatim as backup
  nominatim: NominatimProvider,
};

/** Points closer than ~100 m share one cached name (3 decimal places). */
const cacheKey = (lat: number, lng: number) => `${lat.toFixed(3)},${lng.toFixed(3)}`;
const MAX_CACHE = 5000;

@Injectable()
export class GeocodeService {
  private readonly logger = new Logger(GeocodeService.name);
  private readonly provider: GeocodeProvider;
  /** Names rarely change, so we remember them (oldest dropped first when full). */
  private readonly cache = new Map<string, PlaceName | null>();

  constructor(config: ConfigService) {
    const name = config.get<string>('GEOCODE_PROVIDER') || 'overpass';
    const Provider = PROVIDERS[name];
    if (!Provider) {
      throw new Error(`Unknown GEOCODE_PROVIDER "${name}". Use one of: ${Object.keys(PROVIDERS).join(', ')}`);
    }
    this.provider = new Provider(config);
    this.logger.log(`Place names: ${name}`);
  }

  /** null = no name found (the app then uses the phone's own geocoder). */
  async reverse(lat: number, lng: number): Promise<PlaceName | null> {
    const key = cacheKey(lat, lng);
    if (this.cache.has(key)) return this.cache.get(key) ?? null;

    try {
      const place = await this.provider.reverse(lat, lng);
      if (this.cache.size >= MAX_CACHE) this.cache.delete(this.cache.keys().next().value!);
      this.cache.set(key, place);
      return place;
    } catch (e) {
      // Not cached, so it is tried again next time.
      this.logger.warn(`Reverse geocode failed for ${key}: ${(e as Error).message}`);
      return null;
    }
  }
}