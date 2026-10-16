import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { buildMapHtml } from './mapHtml';
import type { AppMapHandle, AppMapProps } from './mapTypes';

/** Web preview only (testing): the same Leaflet page in an iframe. */
export const AppMap = forwardRef<AppMapHandle, AppMapProps>(function AppMap(
  { initialCenter, initialZoom = 13, markers = [], onMarkerPress, userLocation, onMoveEnd },
  ref,
) {
  const frame = useRef<HTMLIFrameElement | null>(null);
  const [ready, setReady] = useState(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const html = useMemo(() => buildMapHtml(initialCenter, initialZoom), []);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const api = () => (frame.current?.contentWindow as any)?.__map;

  const pending = useRef<(() => void) | null>(null);
  useImperativeHandle(ref, () => ({
    flyTo: (p, zoom) => {
      const go = () => api()?.flyTo(p.latitude, p.longitude, zoom);
      if (ready) go();
      else pending.current = go;
    },
  }));
  useEffect(() => {
    if (ready && pending.current) {
      pending.current();
      pending.current = null;
    }
  }, [ready]);
  useEffect(() => {
    if (ready) api()?.setMarkers(markers);
  }, [ready, markers]);
  useEffect(() => {
    if (ready && userLocation) api()?.setUser(userLocation.latitude, userLocation.longitude);
  }, [ready, userLocation]);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow || typeof e.data?.__appMap !== 'string') return;
      const msg = JSON.parse(e.data.__appMap);
      if (msg.type === 'ready') setReady(true);
      else if (msg.type === 'marker') onMarkerPress?.(msg.id);
      else if (msg.type === 'move') onMoveEnd?.({ latitude: msg.latitude, longitude: msg.longitude }, msg.zoom);
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [onMarkerPress, onMoveEnd]);

  return (
    <View style={styles.container}>
      <iframe ref={frame} srcDoc={html} style={{ border: 0, width: '100%', height: '100%' }} title="Map" />
    </View>
  );
});

const styles = StyleSheet.create({ container: { flex: 1, overflow: 'hidden' } });