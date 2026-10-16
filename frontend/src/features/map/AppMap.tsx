import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { AppText } from '@/components/ui';
import { MAP_CONFIG } from '@/config/map';
import { colors, spacing } from '@/theme';

import { buildMapHtml } from './mapHtml';
import type { AppMapHandle, AppMapProps } from './mapTypes';

/**
 * The app's map (OpenStreetMap + Leaflet inside a WebView; works in Expo Go).
 * Screens only use AppMap and its props, so switching to Google Maps later
 * means rewriting this one file.
 */
export const AppMap = forwardRef<AppMapHandle, AppMapProps>(function AppMap(
  { initialCenter, initialZoom = 13, markers = [], onMarkerPress, userLocation, onMoveEnd },
  ref,
) {
  const webRef = useRef<WebView>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** A flyTo asked for before the map finished loading; done once it is ready. */
  const pendingFly = useRef<string | null>(null);

  // Built once; later changes go through window.__map (no reload, no flicker).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const html = useMemo(() => buildMapHtml(initialCenter, initialZoom), []);

  const run = (js: string) => webRef.current?.injectJavaScript(`try{${js}}catch(e){};true;`);

  useImperativeHandle(ref, () => ({
    flyTo: (p, zoom) => {
      const js = `window.__map.flyTo(${p.latitude},${p.longitude},${zoom ?? 'undefined'})`;
      if (ready) run(js);
      else pendingFly.current = js;
    },
  }));

  useEffect(() => {
    if (ready && pendingFly.current) {
      run(pendingFly.current);
      pendingFly.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  useEffect(() => {
    if (ready) run(`window.__map.setMarkers(${JSON.stringify(markers)})`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, markers]);

  useEffect(() => {
    if (ready && userLocation) run(`window.__map.setUser(${userLocation.latitude},${userLocation.longitude})`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, userLocation]);

  const onMessage = (e: WebViewMessageEvent) => {
    let msg: { type: string; id?: string; latitude?: number; longitude?: number; zoom?: number; message?: string };
    try {
      msg = JSON.parse(e.nativeEvent.data);
    } catch {
      return;
    }
    if (msg.type === 'ready') setReady(true);
    else if (msg.type === 'error') setError(msg.message ?? 'Map could not load.');
    else if (msg.type === 'marker' && msg.id) onMarkerPress?.(msg.id);
    else if (msg.type === 'move' && msg.latitude !== undefined && msg.longitude !== undefined) {
      onMoveEnd?.({ latitude: msg.latitude, longitude: msg.longitude }, msg.zoom ?? initialZoom);
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webRef}
        source={{ html, baseUrl: MAP_CONFIG.baseUrl }}
        originWhitelist={['*']}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        overScrollMode="never"
        setBuiltInZoomControls={false}
        style={styles.web}
      />
      {error ? (
        <View style={styles.error}>
          <AppText color="textSecondary" align="center">
            {error}
          </AppText>
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden', backgroundColor: '#EEF2EF' },
  web: { flex: 1, backgroundColor: 'transparent' },
  error: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.primaryLight,
  },
});