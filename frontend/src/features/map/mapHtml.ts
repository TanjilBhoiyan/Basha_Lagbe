import { MAP_CONFIG } from '@/config/map';
import { colors } from '@/theme';

import type { LatLng } from './mapTypes';

/**
 * The Leaflet page that runs inside the WebView.
 * App -> map: window.__map.* functions (called with injectJavaScript).
 * Map -> app: JSON messages { type: 'ready' | 'marker' | 'move', ... }.
 */
export function buildMapHtml(center: LatLng, zoom: number): string {
  const config = JSON.stringify({
    center: [center.latitude, center.longitude],
    zoom,
    tileUrl: MAP_CONFIG.tileUrl,
    attribution: MAP_CONFIG.attribution,
    maxZoom: MAP_CONFIG.maxZoom,
  });

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html, body, #map { margin: 0; height: 100%; width: 100%; background: #eef2ef; }
  .price { transform: translate(-50%, -100%); display: flex; flex-direction: column; align-items: center; }
  .price b {
    font: 800 13px -apple-system, Roboto, sans-serif; white-space: nowrap;
    padding: 5px 9px; border-radius: 10px; border: 2px solid #fff;
    background: ${colors.primaryDeep}; color: #fff; box-shadow: 0 1px 4px rgba(0,0,0,.25);
  }
  .price i { width: 10px; height: 10px; margin-top: 2px; border-radius: 5px; border: 2px solid #fff; background: ${colors.primaryDeep}; }
  .price.on b { background: #fff; color: ${colors.primaryDeep}; border-color: ${colors.primaryDeep}; }
  .price.on i { background: ${colors.primary}; }
  .me { width: 16px; height: 16px; border-radius: 8px; background: #2563EB; border: 3px solid #fff; box-shadow: 0 0 0 6px rgba(37,99,235,.2); transform: translate(-50%, -50%); }
  .leaflet-div-icon { background: none; border: none; }
</style>
</head>
<body>
<div id="map"></div>
<script>
  var cfg = ${config};
  function send(msg) {
    var text = JSON.stringify(msg);
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(text);
    else if (window.parent !== window) window.parent.postMessage({ __appMap: text }, '*'); // web preview (iframe)
  }
  if (!window.L) { send({ type: 'error', message: 'Map could not load. Check the internet connection.' }); }
  var map = L.map('map', { zoomControl: false, attributionControl: true }).setView(cfg.center, cfg.zoom);
  L.tileLayer(cfg.tileUrl, { maxZoom: cfg.maxZoom, attribution: cfg.attribution }).addTo(map);
  map.attributionControl.setPrefix(false);

  var markerLayer = L.layerGroup().addTo(map);
  var meMarker = null;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  window.__map = {
    setMarkers: function (list) {
      markerLayer.clearLayers();
      list.forEach(function (m) {
        var icon = L.divIcon({ className: '', iconSize: [0, 0], html: '<div class="price' + (m.selected ? ' on' : '') + '"><b>' + esc(m.label) + '</b><i></i></div>' });
        L.marker([m.latitude, m.longitude], { icon: icon, zIndexOffset: m.selected ? 1000 : 0 })
          .on('click', function () { send({ type: 'marker', id: m.id }); })
          .addTo(markerLayer);
      });
    },
    flyTo: function (lat, lng, zoom) { map.flyTo([lat, lng], zoom || map.getZoom(), { duration: 0.6 }); },
    setUser: function (lat, lng) {
      if (meMarker) { meMarker.setLatLng([lat, lng]); return; }
      meMarker = L.marker([lat, lng], { icon: L.divIcon({ className: '', iconSize: [0, 0], html: '<div class="me"></div>' }), interactive: false }).addTo(map);
    }
  };

  map.on('moveend', function () {
    var c = map.getCenter();
    send({ type: 'move', latitude: c.lat, longitude: c.lng, zoom: map.getZoom() });
  });
  send({ type: 'ready' });
</script>
</body>
</html>`;
}