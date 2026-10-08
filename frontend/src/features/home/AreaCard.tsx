import { Image, Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import type { Location } from '@/types/location';
import { formatBdNumber } from '@/utils/format';

type Props = {
  location: Location;
  onPress: () => void;
};

export function AreaCard({ location, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${location.name}, ${location.listingCount} listings`}
    >
      {location.image ? <Image source={location.image} style={styles.image} /> : null}
      <AppText variant="bodyBold" numberOfLines={1} style={styles.name}>
        {location.name}
      </AppText>
      <AppText variant="small" color="textSecondary" style={styles.count}>
        {formatBdNumber(location.listingCount)} listings
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 128,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.85 },
  image: { width: '100%', height: 88 },
  name: { paddingHorizontal: spacing.sm, paddingTop: spacing.sm },
  count: { paddingHorizontal: spacing.sm, paddingBottom: spacing.sm },
});