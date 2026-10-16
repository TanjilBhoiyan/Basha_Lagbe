import { Logger } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';

import type { GeocodeProvider, PlaceName } from '../geocode.provider.js';
import { NominatimProvider } from './nominatim.provider.js';

/** Free public Overpass servers. If one is busy (502/504/429) we try the next. */
const DEFAULT_URLS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];
/** Per server, so a slow one doesn't keep the user waiting long. */
const TIMEOUT_MS = 6000;
/** Be gentle with the free Overpass server: at most ~1 request per second. */
const MIN_GAP_MS = 1100;
/** Look for a named area (Mohakhali, Banani...) this close to the point. */
const AREA_RADIUS_M = 1500;
/** Look for the city/town (Dhaka, Chattogram...) this close to the point. */
const CITY_RADIUS_M = 25000;

type OsmNode = { lat: number; lon: number; tags?: Record<string, string> };

/** Straight-line distance in metres (good enough for a few km). */
function metres(lat1: number, lng1: number, lat2: number, lng2: number) {
  const k = Math.PI / 180;
  const x = (lng2 - lng1) * k * Math.cos(((lat1 + lat2) / 2) * k);
  const y = (lat2 - lat1) * k;
  return Math.sqrt(x * x + y * y) * 6371000;
}

/** Closest node to the point, or undefined. */
function nearest(nodes: OsmNode[], lat: number, lng: number) {
  let best: OsmNode | undefined;
  let bestD = Infinity;
  for (const n of nodes) {
    const d = metres(lat, lng, n.lat, n.lon);
    if (d < bestD) {
      bestD = d;
      best = n;
    }
  }
  return best;
}

/** English name if OSM has one ("Mohakhali"), otherwise the local one ("মহাখালী"). */
const nameOf = (n?: OsmNode) => (n?.tags?.['name:en'] ?? n?.tags?.name)?.trim() || undefined;

/**
 * The area name people actually use: the nearest OpenStreetMap "place" point
 * (suburb / quarter / neighbourhood) around the pin, e.g. "Mohakhali" for TB Gate.
 * Small blocks ("Block Ja", place=locality) are skipped.
 * If Overpass has nothing nearby or can't be reached, we ask Nominatim instead.
 * .env: GEOCODE_PROVIDER="overpass". Optional OVERPASS_URLS="https://a/api/interpreter,https://b/api/interpreter"
 * (our own server list, tried in order).
 */
export class OverpassProvider implements GeocodeProvider {
  private readonly logger = new Logger(OverpassProvider.name);
  private readonly urls: string[];
  /** The server that worked last time; we start with it. */
  private current = 0;
  private readonly fallback: NominatimProvider;
  /** Requests wait in line so we never send more than 1 per second. */
  private queue: Promise<unknown> = Promise.resolve();
  private lastAt = 0;

  constructor(config: ConfigService) {
    const fromEnv = (config.get<string>('OVERPASS_URLS') ?? '')
      .split(',')
      .map((u) => u.trim())
      .filter(Boolean);
    this.urls = fromEnv.length ? fromEnv : DEFAULT_URLS;
    this.fallback = new NominatimProvider(config);
  }

  async reverse(lat: number, lng: number): Promise<PlaceName | null> {
    try {
      const place = await this.inLine(() => this.fetchArea(lat, lng));
      if (place) return place;
    } catch (e) {
      this.logger.warn(`Overpass failed, using Nominatim: ${(e as Error).message}`);
    }
    return this.fallback.reverse(lat, lng);
  }

  private inLine<T>(job: () => Promise<T>): Promise<T> {
    const run = this.queue.then(async () => {
      const wait = this.lastAt + MIN_GAP_MS - Date.now();
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      this.lastAt = Date.now();
      return job();
    });
    this.queue = run.catch(() => undefined);
    return run;
  }

  private async fetchArea(lat: number, lng: number): Promise<PlaceName | null> {
    // One request: nearby areas + nearby cities.
    const query = `[out:json][timeout:8];
(
  node(around:${AREA_RADIUS_M},${lat},${lng})[place~"^(suburb|quarter|neighbourhood)$"][name];
  node(around:${CITY_RADIUS_M},${lat},${lng})[place~"^(city|town)$"][name];
);
out;`;

    const nodes = await this.ask(query);

    const isCity = (n: OsmNode) => n.tags?.place === 'city' || n.tags?.place === 'town';
    const area = nameOf(nearest(nodes.filter((n) => !isCity(n)), lat, lng));
    if (!area) return null; // nothing close by: Nominatim decides
    const city = nameOf(nearest(nodes.filter(isCity), lat, lng));
    return { name: area, city: city ?? area };
  }

  /** Sends the query to each server in turn until one answers. Throws if all fail. */
  private async ask(query: string): Promise<OsmNode[]> {
    const errors: string[] = [];
    for (let i = 0; i < this.urls.length; i++) {
      const index = (this.current + i) % this.urls.length;
      const url = this.urls[index];
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'User-Agent': 'BasaLagbe/1.0 (house rental app, Bangladesh)',
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ data: query }),
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { elements?: OsmNode[] };
        this.current = index; // remember the server that works
        return data.elements ?? [];
      } catch (e) {
        errors.push(`${new URL(url).host}: ${(e as Error).message}`);
      }
    }
    throw new Error(errors.join(' | '));
  }
}