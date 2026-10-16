import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ExpoLocation from 'expo-location';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button } from '@/components/ui';
import { AppMap } from '@/features/map/AppMap';
import type { AppMapHandle, LatLng } from '@/features/map/mapTypes';
import { placeName, type PlaceName } from '@/features/map/placeName';
import { locationService } from '@/services/locationService';
import { colors, radius, SCREEN_PADDING, spacing } from '@/theme';
import { locationLabel, NEAR_RADIUS_KM, type Location } from '@/types/location';

/** Dhaka city centre, used when we have no better starting point. */
const DHAKA: LatLng = { latitude: 23.8103, longitude: 90.4125 };
const PIN_ZOOM = 16;

type GpsState = 'locating' | 'found' | 'denied' | 'blocked' | 'failed';

/**
 * "Use my current location": opens at the user's GPS position; the pin stays in the
 * middle and the user moves the map until it sits on their home, then confirms.
 */
export default function PickLocationScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<AppMapHandle>(null);

  const [start, setStart] = useState<LatLng | null>(null);
  const [center, setCenter] = useState<LatLng | null>(null);
  const [me, setMe] = useState<LatLng | null>(null);
  const [gps, setGps] = useState<GpsState>('locating');
  const [place, setPlace] = useState<PlaceName | null>(null);
  const [naming, setNaming] = useState(false);
  const [saving, setSaving] = useState(false);
  /** GPS result, in case it arrives before the map is on screen. */
  const gpsHere = useRef<LatLng | null>(null);

  /** Asks for permission (first time), then moves the map to the user. */
  const locate = useCallback(async () => {
    setGps('locating');
    try {
      const { status, canAskAgain } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setGps(canAskAgain ? 'denied' : 'blocked');
        return;
      }
      const pos = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.High });
      const here = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      gpsHere.current = here;
      setMe(here);
      setCenter(here);
      if (mapRef.current) mapRef.current.flyTo(here, PIN_ZOOM);
      else setStart((s) => s ?? here);
      setGps('found');
    } catch {
      setGps('failed');
    }
  }, []);

  // Open where the user last chose (or Dhaka), then jump to GPS.
  useEffect(() => {
    locationService.getSelected().then((current) => {
      if (gpsHere.current) return; // GPS was faster: the map already opens there
      const first = current ? { latitude: current.latitude, longitude: current.longitude } : DHAKA;
      setStart((s) => s ?? first);
      setCenter((c) => c ?? first);
    });
    locate();
  }, [locate]);

  // Name the place under the pin once the map stops moving.
  useEffect(() => {
    if (!center) return;
    setNaming(true);
    let active = true;
    const timer = setTimeout(async () => {
      const result = await placeName(center);
      if (active) {
        setPlace(result);
        setNaming(false);
      }
    }, 500);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [center]);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/select-location'));

  const confirm = async () => {
    if (!center) return;
    setSaving(true);
    const name = place ?? (await placeName(center));
    const pin: Location = {
      id: 'pin',
      name: name.name,
      city: name.city,
      listingCount: 0,
      latitude: center.latitude,
      longitude: center.longitude,
      isPin: true,
    };
    await locationService.select(pin);
    // Back to Home (closes Select Location too).
    if (router.canDismiss()) router.dismissAll();
    router.replace('/home');
  };

  const gpsNote =
    gps === 'denied' || gps === 'blocked'
      ? 'Location is off. Move the map to your area, or allow location access.'
      : gps === 'failed'
        ? 'Could not find your location. Move the map to your area.'
        : null;

  return (
    <View style={styles.screen}>
      {start ? (
        <AppMap
          ref={mapRef}
          initialCenter={start}
          initialZoom={PIN_ZOOM - 2}
          userLocation={me}
          onMoveEnd={(c) => setCenter(c)}
        />
      ) : (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}

      {/* Fixed pin in the middle: its tip marks the chosen point. */}
      <View pointerEvents="none" style={styles.pinWrap}>
        <View style={styles.pinLabel}>
          <AppText variant="small" style={styles.pinLabelText}>
            Your home is here
          </AppText>
        </View>
        <MaterialCommunityIcons name="map-marker" size={52} color={colors.primaryDeep} style={styles.pin} />
      </View>

      <View style={[styles.topBar, { top: insets.top + spacing.sm }]}>
        <Pressable onPress={goBack} style={styles.circle} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.titleCard}>
          <AppText variant="bodyBold">Pin your location</AppText>
          <AppText variant="small" color="textSecondary">
            Move the map to put the pin on your area
          </AppText>
        </View>
      </View>

      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <Pressable
          onPress={locate}
          style={styles.gpsButton}
          accessibilityRole="button"
          accessibilityLabel="Go to my current location"
        >
          {gps === 'locating' ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <MaterialCommunityIcons name="crosshairs-gps" size={24} color={colors.text} />
          )}
        </Pressable>

        <View style={styles.placeRow}>
          <View style={styles.placeIcon}>
            <Ionicons name="location" size={22} color={colors.primary} />
          </View>
          <View style={styles.flex}>
            <AppText variant="caption" color="textSecondary">
              Selected location
            </AppText>
            {naming || !place ? (
              <AppText variant="bodyBold" color="textSecondary">
                Finding address…
              </AppText>
            ) : (
              <AppText variant="h3" numberOfLines={2}>
                {locationLabel(place)}
              </AppText>
            )}
          </View>
        </View>

        {gpsNote ? (
          <View style={styles.note}>
            <Ionicons name="information-circle-outline" size={18} color={colors.warning} />
            <AppText variant="caption" style={styles.flex}>
              {gpsNote}
            </AppText>
            {gps === 'blocked' ? (
              <Pressable onPress={() => Linking.openSettings()} hitSlop={8} accessibilityRole="button">
                <AppText variant="caption" color="primary" style={styles.bold}>
                  Settings
                </AppText>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <AppText variant="caption" color="textSecondary">
            We will show homes within {NEAR_RADIUS_KM} km of this point, nearest first.
          </AppText>
        )}

        <Button
          title="Confirm location"
          onPress={confirm}
          loading={saving}
          disabled={!center}
          leftIcon={<Ionicons name="checkmark" size={20} color={colors.white} />}
        />
      </View>
    </View>
  );
}

const PIN_SIZE = 52;
const LABEL_HEIGHT = 26;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.backgroundMint },
  flex: { flex: 1 },
  bold: { fontWeight: '700' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pinWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Lift label + pin so the pin's tip (not the group's middle) sits on the map centre.
  pin: { marginBottom: PIN_SIZE + LABEL_HEIGHT + 4 },
  pinLabel: {
    height: LABEL_HEIGHT,
    justifyContent: 'center',
    marginBottom: 4,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.full,
    backgroundColor: colors.text,
  },
  pinLabelText: { color: colors.white, fontWeight: '700' },
  topBar: {
    position: 'absolute',
    left: SCREEN_PADDING,
    right: SCREEN_PADDING,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  circle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  titleCard: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    gap: spacing.md,
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: spacing.lg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    backgroundColor: colors.white,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -2 },
  },
  gpsButton: {
    position: 'absolute',
    right: SCREEN_PADDING,
    top: -68,
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
  placeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  placeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm + 2,
    borderRadius: radius.md,
    backgroundColor: colors.warningLight,
  },
});