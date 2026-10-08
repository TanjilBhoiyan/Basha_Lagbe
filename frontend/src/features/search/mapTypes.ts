import type { Property } from '@/types/property';

export type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export type PropertyMapProps = {
  properties: Property[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Area to show; the map animates when it changes. */
  region: MapRegion;
};

/** "৳28K" for map pins. */
export function shortPrice(rent: number) {
  return rent >= 1000 ? `৳${Math.round(rent / 1000)}K` : `৳${rent}`;
}