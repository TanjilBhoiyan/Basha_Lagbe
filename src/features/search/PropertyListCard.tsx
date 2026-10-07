import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import type { Property } from '@/types/property';
import { formatBdNumber, formatTaka, plural } from '@/utils/format';

type Props = {
  property: Property;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onPress: () => void;
  /** Highlights the card (e.g. the one picked on the map). */
  highlighted?: boolean;
};

/** Horizontal property card: photo on the left, details on the right. */
export function PropertyListCard({
  property,
  isFavorite,
  onToggleFavorite,
  onPress,
  highlighted,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, highlighted && styles.highlighted, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${property.title}, ${formatTaka(property.monthlyRent)} per month`}
    >
      <View>
        <Image source={property.images[0]} style={styles.image} />
        {property.isVerified ? (
          <View style={styles.verified}>
            <Ionicons name="checkmark-circle" size={12} color={colors.white} />
          </View>
        ) : null}
        {property.images.length > 1 ? (
          <View style={styles.dots}>
            {property.images.map((_, i) => (
              <View key={i} style={[styles.dot, i === 0 && styles.dotActive]} />
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <AppText variant="bodyBold" numberOfLines={2} style={styles.title}>
            {property.title}
          </AppText>
          <Pressable
            onPress={onToggleFavorite}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={22}
              color={isFavorite ? colors.favorite : colors.text}
            />
          </Pressable>
        </View>

        <View style={styles.row}>
          <Ionicons name="location" size={13} color={colors.primary} />
          <AppText variant="small" color="textSecondary" numberOfLines={1}>
            {property.areaLabel}
          </AppText>
        </View>

        <AppText style={styles.rent}>
          {formatTaka(property.monthlyRent)}
          <AppText variant="caption" color="primaryDeep">
            {' '}
            / month
          </AppText>
        </AppText>

        <View style={styles.specs}>
          {property.bedrooms > 0 ? (
            <AppText variant="small" color="textSecondary">
              {plural(property.bedrooms, 'Bed')}
            </AppText>
          ) : null}
          <AppText variant="small" color="textSecondary">
            {plural(property.bathrooms, 'Bath')}
          </AppText>
          <AppText variant="small" color="textSecondary">
            {formatBdNumber(property.sizeSqft)} sqft
          </AppText>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  highlighted: { borderColor: colors.primary },
  pressed: { opacity: 0.9 },
  image: { width: 120, height: 104, borderRadius: radius.md },
  verified: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: { position: 'absolute', bottom: 6, left: 6, flexDirection: 'row', gap: 3 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.6)' },
  dotActive: { backgroundColor: colors.white },
  body: { flex: 1, gap: 3, justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  title: { flex: 1, fontSize: 14, lineHeight: 19 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  rent: { fontSize: 17, lineHeight: 22, fontWeight: '800', color: colors.primaryDeep },
  specs: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
});