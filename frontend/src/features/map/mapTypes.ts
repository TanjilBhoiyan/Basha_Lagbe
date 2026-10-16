export type LatLng = { latitude: number; longitude: number };

/** A price bubble (or any labelled pin) on the map. */
export type MapMarker = LatLng & { id: string; label: string; selected?: boolean };

/** What screens can ask the map to do (same for OpenStreetMap now and Google Maps later). */
export type AppMapHandle = {
  flyTo: (point: LatLng, zoom?: number) => void;
};

export type AppMapProps = {
  /** Where the map opens. Later moves go through flyTo. */
  initialCenter: LatLng;
  initialZoom?: number;
  markers?: MapMarker[];
  onMarkerPress?: (id: string) => void;
  /** Blue "you are here" dot. */
  userLocation?: LatLng | null;
  /** Fires when the user stops dragging/zooming, with the new centre. */
  onMoveEnd?: (center: LatLng, zoom: number) => void;
};

/** latitudeDelta-style span -> map zoom level (bigger span = smaller zoom). */
export function spanToZoom(longitudeDelta: number) {
  return Math.max(3, Math.min(18, Math.round(Math.log2(360 / Math.max(longitudeDelta, 0.0005)))));
}