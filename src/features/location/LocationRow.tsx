import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { locationLabel, type Location } from '@/types/location';
import { formatBdNumber } from '@/utils/format';

type Props = {
  location: Location;
  selected: boolean;
  onPress: () => void;
};

export function LocationRow({ location, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, selected && styles.selected, pressed && styles.pressed]}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${locationLabel(location)}, ${location.listingCount} listings`}
    >
      {location.image ? (
        <Image source={location.image} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Ionicons name="business-outline" size={26} color={colors.primary} />
        </View>
      )}

      <Ionicons name="location" size={22} color={colors.primary} />

      <View style={styles.text}>
        <AppText variant="bodyBold" numberOfLines={1}>
          {locationLabel(location)}
        </AppText>
        <AppText variant="caption" color="textSecondary">
          {formatBdNumber(location.listingCount)} listings
        </AppText>
      </View>

      <Ionicons
        name={selected ? 'checkmark-circle' : 'chevron-forward'}
        size={selected ? 24 : 20}
        color={selected ? colors.primary : colors.textSecondary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.xs + 2,
    paddingRight: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  selected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  pressed: { opacity: 0.85 },
  image: { width: 92, height: 60, borderRadius: radius.md },
  imagePlaceholder: {
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: 2 },
});