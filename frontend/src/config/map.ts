/**
 * Map tiles (the map pictures). Free OpenStreetMap for now.
 *
 * Before going live, switch to a tile provider's free plan (MapTiler, Stadia, Carto...)
 * by setting these in frontend/.env — no code change:
 *   EXPO_PUBLIC_MAP_TILE_URL="https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key=..."
 *   EXPO_PUBLIC_MAP_ATTRIBUTION="© MapTiler © OpenStreetMap contributors"
 */
export const MAP_CONFIG = {
  tileUrl: process.env.EXPO_PUBLIC_MAP_TILE_URL ?? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: process.env.EXPO_PUBLIC_MAP_ATTRIBUTION ?? '© OpenStreetMap contributors',
  maxZoom: 19,
  /** Sent as the page address (OpenStreetMap asks apps to identify themselves). */
  baseUrl: 'https://basalagbe.app/',
} as const;