import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';

import { colors } from '@/theme';

import type { AppMapHandle, AppMapProps, LatLng } from './mapTypes';

/** Map zoom level <-> how many degrees of longitude fit on screen. */
const zoomToDelta = (zoom: number) => 360 / 2 ** zoom;
const deltaToZoom = (delta: number) => Math.log2(360 / Math.max(delta, 0.0001));

/** Custom marker views are drawn once into a bitmap; redraw for a moment after they change. */
const REDRAW_MS = 600;

/**
 * The app's map (Google Maps via react-native-maps; key from frontend/.env through app.config.js).
 * Screens only use AppMap and its props, so the map provider can change without touching them.
 * The old OpenStreetMap version is in AppMap.osm.tsx (not used; delete once Google is settled).
 */
export const AppMap = forwardRef<AppMapHandle, AppMapProps>(function AppMap(
  { initialCenter, initialZoom = 13, markers = [], onMarkerPress, userLocation, onMoveEnd },
  ref,
) {
  const mapRef = useRef<MapView>(null);
  const [redraw, setRedraw] = useState(true);

  useImperativeHandle(ref, () => ({
    flyTo: (p: LatLng, zoom?: number) => {
      mapRef.current?.animateCamera(
        { center: { latitude: p.latitude, longitude: p.longitude }, ...(zoom !== undefined ? { zoom } : {}) },
        { duration: 600 },
      );
    },
  }));

  // Price bubbles changed (new list or a new selection): let Android redraw them, then freeze for speed.
  useEffect(() => {
    setRedraw(true);
    const t = setTimeout(() => setRedraw(false), REDRAW_MS);
    return () => clearTimeout(t);
  }, [markers]);

  const delta = zoomToDelta(initialZoom);
  const onRegionChangeComplete = (r: Region) => {
    onMoveEnd?.({ latitude: r.latitude, longitude: r.longitude }, deltaToZoom(r.longitudeDelta));
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        initialRegion={{
          latitude: initialCenter.latitude,
          longitude: initialCenter.longitude,
          latitudeDelta: delta,
          longitudeDelta: delta,
        }}
        onRegionChangeComplete={onRegionChangeComplete}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
      >
        {markers.map((m) => (
          <Marker
            key={m.id}
            coordinate={{ latitude: m.latitude, longitude: m.longitude }}
            anchor={{ x: 0.5, y: 1 }}
            zIndex={m.selected ? 1000 : 1}
            tracksViewChanges={redraw}
            onPress={() => onMarkerPress?.(m.id)}
          >
            <View style={styles.price}>
              <View style={[styles.bubble, m.selected && styles.bubbleOn]}>
                <Text style={[styles.bubbleText, m.selected && styles.bubbleTextOn]}>{m.label}</Text>
              </View>
              <View style={[styles.dot, m.selected && styles.dotOn]} />
            </View>
          </Marker>
        ))}

        {userLocation ? (
          <Marker coordinate={userLocation} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false} zIndex={2000}>
            <View style={styles.meHalo}>
              <View style={styles.me} />
            </View>
          </Marker>
        ) : null}
      </MapView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden', backgroundColor: '#EEF2EF' },
  price: { alignItems: 'center' },
  bubble: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.white,
    backgroundColor: colors.primaryDeep,
  },
  bubbleOn: { backgroundColor: colors.white, borderColor: colors.primaryDeep },
  bubbleText: { fontSize: 13, fontWeight: '800', color: colors.white },
  bubbleTextOn: { color: colors.primaryDeep },
  dot: {
    width: 10,
    height: 10,
    marginTop: 2,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.white,
    backgroundColor: colors.primaryDeep,
  },
  dotOn: { backgroundColor: colors.primary },
  meHalo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(37,99,235,0.2)',
  },
  me: { width: 16, height: 16, borderRadius: 8, borderWidth: 3, borderColor: colors.white, backgroundColor: '#2563EB' },
});