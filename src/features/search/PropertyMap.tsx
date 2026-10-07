import * as ExpoLocation from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AppText } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { shortPrice, type PropertyMapProps } from './mapTypes';

export function PropertyMap({ properties, selectedId, onSelect, region }: PropertyMapProps) {
  const mapRef = useRef<MapView>(null);
  const [showUser, setShowUser] = useState(false);
  const [locating, setLocating] = useState(false);

  // Move the map when the selected area changes.
  useEffect(() => {
    mapRef.current?.animateToRegion(region, 500);
  }, [region]);

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
      setShowUser(true);
      const pos = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced,
      });
      mapRef.current?.animateToRegion(
        {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        },
        500,
      );
    } catch {
      Alert.alert('Location unavailable', 'Could not get your location. Please try again.');
    } finally {
      setLocating(false);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        showsUserLocation={showUser}
        showsMyLocationButton={false}
        toolbarEnabled={false}
      >
        {properties.map((p) => {
          const selected = p.id === selectedId;
          return (
            <Marker
              key={`${p.id}-${selected ? 1 : 0}`}
              coordinate={{ latitude: p.latitude, longitude: p.longitude }}
              onPress={() => onSelect(p.id)}
              anchor={{ x: 0.5, y: 1 }}
              zIndex={selected ? 2 : 1}
            >
              <View style={styles.pin}>
                <View style={[styles.bubble, selected && styles.bubbleSelected]}>
                  <AppText style={[styles.price, selected && styles.priceSelected]}>
                    {shortPrice(p.monthlyRent)}
                  </AppText>
                </View>
                <View style={[styles.dot, selected && styles.dotSelected]} />
              </View>
            </Marker>
          );
        })}
      </MapView>

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
  pin: { alignItems: 'center' },
  bubble: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.md,
    backgroundColor: colors.primaryDeep,
    borderWidth: 2,
    borderColor: colors.white,
  },
  bubbleSelected: { backgroundColor: colors.white, borderColor: colors.primaryDeep },
  price: { color: colors.white, fontWeight: '800', fontSize: 13 },
  priceSelected: { color: colors.primaryDeep },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 2,
    backgroundColor: colors.primaryDeep,
    borderWidth: 2,
    borderColor: colors.white,
  },
  dotSelected: { backgroundColor: colors.primary },
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