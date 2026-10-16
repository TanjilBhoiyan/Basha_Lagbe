import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ExpoLocation from 'expo-location';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, View } from 'react-native';

import { AppMap } from '@/features/map/AppMap';
import { spanToZoom, type AppMapHandle, type LatLng } from '@/features/map/mapTypes';
import { colors, spacing } from '@/theme';
import { shortPrice, type PropertyMapProps } from './mapTypes';

/** Search > Map: a price bubble per listing, tap to select; "my location" button. */
export function PropertyMap({ properties, selectedId, onSelect, region }: PropertyMapProps) {
  const mapRef = useRef<AppMapHandle>(null);
  const [me, setMe] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);
  const firstRegion = useRef(region);

  // Move the map when the selected area changes.
  useEffect(() => {
    if (region === firstRegion.current) return;
    mapRef.current?.flyTo(region, spanToZoom(region.longitudeDelta));
  }, [region]);

  const markers = useMemo(
    () =>
      properties.map((p) => ({
        id: p.id,
        latitude: p.latitude,
        longitude: p.longitude,
        label: shortPrice(p.monthlyRent),
        selected: p.id === selectedId,
      })),
    [properties, selectedId],
  );

  const goToMyLocation = async () => {
    setLocating(true);
    try {
      const { status, canAskAgain } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location permission needed',
          'Allow location access to see rentals near you. You can still search by area without it.',
          canAskAgain
            ? [{ text: 'OK' }]
            : [
                { text: 'Not now', style: 'cancel' },
                { text: 'Open Settings', onPress: () => Linking.openSettings() },
              ],
        );
        return;
      }
      const pos = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.Balanced });
      const here = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setMe(here);
      mapRef.current?.flyTo(here, 15);
    } catch {
      Alert.alert('Location unavailable', 'Could not get your location. Please try again.');
    } finally {
      setLocating(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppMap
        ref={mapRef}
        initialCenter={firstRegion.current}
        initialZoom={spanToZoom(firstRegion.current.longitudeDelta)}
        markers={markers}
        onMarkerPress={onSelect}
        userLocation={me}
      />

      <Pressable
        onPress={goToMyLocation}
        style={styles.locate}
        accessibilityRole="button"
        accessibilityLabel="Show my location"
      >
        {locating ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <MaterialCommunityIcons name="crosshairs-gps" size={26} color={colors.text} />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  locate: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
});