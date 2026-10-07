import { Ionicons } from '@expo/vector-icons';
import { Image, Linking, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import type { Property } from '@/types/property';
import { formatBdNumber, formatTaka } from '@/utils/format';

type Props = {
  property: Property;
  width: number;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onPress?: () => void;
};

export function PropertyCard({ property, width, isFavorite, onToggleFavorite, onPress }: Props) {
  const callOwner = () => Linking.openURL(`tel:+880${property.owner.phone}`);

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { width }]}
      accessibilityRole="button"
      accessibilityLabel={`${property.title}, ${formatTaka(property.monthlyRent)} per month`}
    >
      <View>
        <Image source={property.images[0]} style={styles.image} />

        <Pressable
          onPress={onToggleFavorite}
          hitSlop={8}
          style={styles.favorite}
          accessibilityRole="button"
          accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
        >
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={22}
            color={isFavorite ? colors.favorite : colors.white}
          />
        </Pressable>

        {property.isVerified ? (
          <View style={styles.verified}>
            <Ionicons name="checkmark-circle" size={14} color={colors.white} />
            <AppText variant="small" style={styles.verifiedText}>
              Verified
            </AppText>
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
        <AppText variant="bodyBold" numberOfLines={1}>
          {property.title}
        </AppText>

        <View style={styles.row}>
          <Ionicons name="location" size={14} color={colors.primary} />
          <AppText variant="caption" color="textSecondary" numberOfLines={1}>
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
            <Spec icon="bed-outline" text={`${property.bedrooms} Beds`} />
          ) : null}
          <Spec icon="water-outline" text={`${property.bathrooms} Baths`} />
          <Spec icon="resize-outline" text={`${formatBdNumber(property.sizeSqft)} sqft`} />
        </View>

        <Pressable
          onPress={callOwner}
          style={({ pressed }) => [styles.contact, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`Call ${property.owner.name}`}
        >
          <Ionicons name="call" size={16} color={colors.primaryDeep} />
          <AppText variant="bodyBold" color="primaryDeep">
            Contact Owner
          </AppText>
        </Pressable>
      </View>
    </Pressable>
  );
}

function Spec({ icon, text }: { icon: 'bed-outline' | 'water-outline' | 'resize-outline'; text: string }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={14} color={colors.textSecondary} />
      <AppText variant="small" color="textSecondary">
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: { width: '100%', height: 150 },
  favorite: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 34,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verified: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  verifiedText: { color: colors.white },
  dots: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    gap: 4,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.6)' },
  dotActive: { backgroundColor: colors.white },
  body: { padding: spacing.md, gap: spacing.xs + 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
  rent: { fontSize: 18, lineHeight: 24, fontWeight: '800', color: colors.primaryDeep },
  specs: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' },
  contact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 40,
    marginTop: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
  },
  pressed: { opacity: 0.8 },
});