import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { AppMap } from '@/features/map/AppMap';
import { colors, radius, spacing } from '@/theme';

import { FieldFooter } from './FormFields';

type Props = {
  latitude: number | null;
  longitude: number | null;
  /** "GP Chha Road, Mohakhali" (empty when editing an old listing). */
  label: string;
  error?: string;
  onPress: () => void;
};

/** Add/Edit Property: the listing's exact spot. Empty = a "Pin on map" button; pinned = small map + Change. */
export function LocationPinField({ latitude, longitude, label, error, onPress }: Props) {
  const pinned = latitude !== null && longitude !== null;

  if (!pinned) {
    return (
      <View>
        <Pressable
          onPress={onPress}
          style={[styles.empty, error ? styles.emptyError : null]}
          accessibilityRole="button"
          accessibilityLabel="Pin the property on the map"
        >
          <MaterialCommunityIcons name="map-marker-plus-outline" size={26} color={colors.primary} />
          <View style={styles.flex}>
            <AppText variant="bodyBold" color="primary">
              Pin on map
            </AppText>
            <AppText variant="caption" color="textSecondary">
              Put the pin on the building so tenants nearby can find it.
            </AppText>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
        </Pressable>
        <FieldFooter error={error} />
      </View>
    );
  }

  return (
    <View>
      <Pressable onPress={onPress} style={styles.card} accessibilityRole="button" accessibilityLabel="Change the pin">
        {/* Look-only map: taps go to the card (opens the picker). New key = map re-centres on a new pin. */}
        <View pointerEvents="none" style={styles.map}>
          <AppMap key={`${latitude},${longitude}`} initialCenter={{ latitude, longitude }} initialZoom={16} />
          <View style={styles.pinWrap}>
            <MaterialCommunityIcons name="map-marker" size={36} color={colors.primaryDeep} style={styles.pin} />
          </View>
        </View>
        <View style={styles.row}>
          <MaterialCommunityIcons name="map-marker-check" size={20} color={colors.primary} />
          <AppText variant="bodyBold" numberOfLines={1} style={styles.flex}>
            {label || 'Location pinned'}
          </AppText>
          <AppText variant="bodyBold" color="primary">
            Change
          </AppText>
        </View>
      </Pressable>
      <FieldFooter hint="Only you see the exact spot. Tenants see the area and a rough location." error={error} />
    </View>
  );
}

const MAP_HEIGHT = 140;
const PIN = 36;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  empty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  emptyError: { borderColor: colors.danger },
  card: {
    overflow: 'hidden',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  map: { height: MAP_HEIGHT },
  pinWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Lift the icon so its tip (not its middle) sits on the map centre.
  pin: { marginBottom: PIN },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
});