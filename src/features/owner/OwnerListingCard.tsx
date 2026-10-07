import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import type { ListingStatus } from '@/types/listing';
import type { Property } from '@/types/property';
import { formatBdNumber, formatTaka, plural } from '@/utils/format';
import { LISTING_STATUS_STYLE } from './listingStatus';

type Props = {
  property: Property;
  status: ListingStatus;
  onView: () => void;
  onEdit: () => void;
};

export function OwnerListingCard({ property, status, onView, onEdit }: Props) {
  const badge = LISTING_STATUS_STYLE[status];
  const specs = [
    ...(property.bedrooms > 0 ? [plural(property.bedrooms, 'Bed')] : []),
    plural(property.bathrooms, 'Bath'),
    `${formatBdNumber(property.sizeSqft)} sqft`,
  ];

  return (
    <View style={styles.card}>
      <Pressable onPress={onView} accessibilityRole="button" accessibilityLabel={`View ${property.title}`}>
        <Image source={property.images[0]} style={styles.image} />
        {property.images.length > 1 ? (
          <View style={styles.dots}>
            {property.images.map((_, i) => (
              <View key={i} style={[styles.dot, i === 0 && styles.dotActive]} />
            ))}
          </View>
        ) : null}
      </Pressable>

      <View style={styles.info}>
        <View style={styles.titleRow}>
          <AppText variant="bodyBold" numberOfLines={2} style={styles.title}>
            {property.title}
          </AppText>
          <View style={[styles.badge, { backgroundColor: badge.background }]}>
            <MaterialCommunityIcons
              name={badge.icon}
              size={status === 'published' ? 9 : 14}
              color={status === 'published' ? colors.primary : badge.color}
            />
            <AppText variant="small" style={[styles.badgeText, { color: badge.color }]}>
              {badge.label}
            </AppText>
          </View>
        </View>

        <View style={styles.line}>
          <Ionicons name="location" size={14} color={colors.primary} />
          <AppText variant="caption" color="textSecondary" numberOfLines={1} style={styles.flex}>
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

        <AppText variant="small" color="textSecondary" numberOfLines={1} style={styles.specs}>
          {specs.join('  •  ')}
        </AppText>

        <View style={styles.actions}>
          <ActionButton icon="eye-outline" label="View" soft onPress={onView} />
          <ActionButton icon="create-outline" label="Edit" onPress={onEdit} />
        </View>
      </View>
    </View>
  );
}

function ActionButton({
  icon,
  label,
  soft,
  onPress,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  soft?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.action, soft ? styles.actionSoft : styles.actionGray, pressed && styles.pressed]}
      accessibilityRole="button"
    >
      <Ionicons name={icon} size={18} color={soft ? colors.primaryDeep : colors.text} />
      <AppText variant="caption" style={[styles.actionLabel, { color: soft ? colors.primaryDeep : colors.text }]}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.sm + 2,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  image: { width: 116, height: 136, borderRadius: radius.md },
  dots: { position: 'absolute', bottom: 6, left: 8, flexDirection: 'row', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.6)' },
  dotActive: { backgroundColor: colors.white },
  info: { flex: 1, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  title: { flex: 1, fontSize: 14, lineHeight: 19 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  line: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  flex: { flex: 1 },
  rent: { fontSize: 17, lineHeight: 22, fontWeight: '800', color: colors.primaryDeep },
  specs: { fontWeight: '400', fontSize: 12 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 38,
    borderRadius: radius.md,
  },
  actionSoft: { backgroundColor: colors.primaryLight },
  actionGray: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  actionLabel: { fontSize: 14, fontWeight: '700' },
  pressed: { opacity: 0.85 },
});