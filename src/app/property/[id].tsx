import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState, type ComponentProps } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, EmptyState } from '@/components/ui';
import {
  AMENITY_OPTIONS,
  formatIsoDate,
  FURNISHING_OPTIONS,
  TENANT_OPTIONS,
} from '@/features/filters/filters';
import { OwnerCard } from '@/features/property/OwnerCard';
import { PhotoGallery } from '@/features/property/PhotoGallery';
import { propertyService } from '@/services/propertyService';
import { colors, radius, SCREEN_PADDING, spacing } from '@/theme';
import type { Property } from '@/types/property';
import { floorLabel, formatBdNumber, formatTaka, plural } from '@/utils/format';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export default function PropertyDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    (async () => {
      const [p, favs] = await Promise.all([
        propertyService.getById(id),
        propertyService.getFavoriteIds(),
      ]);
      setProperty(p);
      setIsFavorite(favs.includes(id));
      setLoading(false);
    })();
  }, [id]);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/home'));

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!property) {
    return (
      <SafeAreaView style={styles.center}>
        <EmptyState
          icon="home-outline"
          title="This listing is no longer available"
          message="It may have been rented out or removed by the owner."
          actionLabel="Go back"
          onAction={goBack}
        />
      </SafeAreaView>
    );
  }

  const toggleFavorite = async () => {
    const next = await propertyService.toggleFavorite(property.id);
    setIsFavorite(next.includes(property.id));
  };

  const share = () =>
    Share.share({
      message: `${property.title} — ${formatTaka(property.monthlyRent)}/month, ${property.areaLabel}.\nbashalagbe://property/${property.id}`,
    });

  const comingSoon = (feature: string) =>
    Alert.alert('Coming soon', `${feature} will be available in the next step.`);

  const openMenu = () =>
    Alert.alert('Listing options', undefined, [
      { text: 'Share listing', onPress: share },
      { text: 'Report this listing', style: 'destructive', onPress: () => comingSoon('Reporting') },
      { text: 'Cancel', style: 'cancel' },
    ]);

  const callOwner = () => Linking.openURL(`tel:+880${property.owner.phone}`);

  const amenities = AMENITY_OPTIONS.filter((a) => property.amenities.includes(a.value));
  const furnishing = FURNISHING_OPTIONS.find((f) => f.value === property.furnishing)?.label;
  const tenants = TENANT_OPTIONS.filter((t) => property.tenantTypes.includes(t.value))
    .map((t) => t.label.replace('\n', ' '))
    .join(', ');

  const specs: { icon: IoniconName; text: string }[] = [
    ...(property.bedrooms > 0 ? [{ icon: 'bed-outline' as const, text: plural(property.bedrooms, 'Bed') }] : []),
    { icon: 'water-outline', text: plural(property.bathrooms, 'Bath') },
    { icon: 'resize-outline', text: `${formatBdNumber(property.sizeSqft)} sqft` },
    { icon: 'business-outline', text: floorLabel(property.floorNumber) },
  ];

  const details: { label: string; value: string }[] = [
    {
      label: 'Advance',
      value:
        property.advanceMonths > 0
          ? `${plural(property.advanceMonths, 'month')} (${formatTaka(property.monthlyRent * property.advanceMonths)})`
          : 'None',
    },
    {
      label: 'Service charge',
      value: property.serviceCharge > 0 ? `${formatTaka(property.serviceCharge)} / month` : 'Included',
    },
    { label: 'Available from', value: formatIsoDate(property.availableFrom) },
    { label: 'Furnishing', value: furnishing ?? '—' },
    { label: 'Floor', value: `${floorLabel(property.floorNumber)} of ${property.totalFloors}` },
    { label: 'Suitable for', value: tenants || 'Anyone' },
  ];

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <PhotoGallery
          images={property.images}
          width={width}
          height={width * 0.72}
          onOpenGallery={() => router.push({ pathname: '/gallery/[id]', params: { id: property.id } })}
        />

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <AppText style={styles.title} accessibilityRole="header">
              {property.title}
            </AppText>
            <Pressable onPress={openMenu} hitSlop={10} accessibilityRole="button" accessibilityLabel="More options">
              <Ionicons name="ellipsis-vertical" size={22} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.row}>
            <Ionicons name="location" size={16} color={colors.primary} />
            <AppText color="textSecondary">{property.areaLabel}</AppText>
          </View>

          <View style={styles.priceRow}>
            <AppText style={styles.rent}>
              {formatTaka(property.monthlyRent)}
              <AppText style={styles.perMonth}> / month</AppText>
            </AppText>
            {property.negotiable ? (
              <View style={styles.negotiable}>
                <AppText variant="caption" color="primaryDeep" style={styles.bold}>
                  Negotiable
                </AppText>
              </View>
            ) : null}
          </View>

          <View style={styles.specs}>
            {specs.map((s, i) => (
              <View key={s.text} style={[styles.spec, i > 0 && styles.specDivider]}>
                <Ionicons name={s.icon} size={20} color={colors.textSecondary} />
                <AppText variant="caption">{s.text}</AppText>
              </View>
            ))}
          </View>

          <View style={styles.separator} />

          <AppText variant="h3">Overview</AppText>
          <AppText color="textSecondary" numberOfLines={expanded ? undefined : 4} style={styles.description}>
            {property.description}
          </AppText>
          {property.description.length > 260 ? (
            <Pressable onPress={() => setExpanded((v) => !v)} hitSlop={8}>
              <AppText variant="bodyBold" color="primary">
                {expanded ? 'Show less' : 'Read more'}
              </AppText>
            </Pressable>
          ) : null}

          {amenities.length ? (
            <View style={styles.chips}>
              {amenities.map((a) => (
                <View key={a.value} style={styles.chip}>
                  <MaterialCommunityIcons name={a.icon} size={18} color={colors.primaryDeep} />
                  <AppText variant="caption">{a.label}</AppText>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.separator} />

          <AppText variant="h3">Rent Details</AppText>
          <View style={styles.details}>
            {details.map((d) => (
              <View key={d.label} style={styles.detailRow}>
                <AppText variant="caption" color="textSecondary" style={styles.detailLabel}>
                  {d.label}
                </AppText>
                <AppText variant="caption" style={styles.detailValue}>
                  {d.value}
                </AppText>
              </View>
            ))}
          </View>

          <View style={styles.privacyNote}>
            <Ionicons name="lock-closed-outline" size={16} color={colors.textSecondary} />
            <AppText variant="small" color="textSecondary" style={styles.flex}>
              Exact address is shared by the owner after you contact them or book a visit.
            </AppText>
          </View>

          <OwnerCard owner={property.owner} onPress={() => comingSoon('Owner profile')} />
        </View>
      </ScrollView>

      {/* Floating buttons over the photo */}
      <View style={[styles.topBar, { top: insets.top + spacing.sm }]} pointerEvents="box-none">
        <CircleButton icon="chevron-back" label="Go back" onPress={goBack} />
        <View style={styles.topRight}>
          <CircleButton icon="share-social-outline" label="Share" onPress={share} />
          <CircleButton
            icon={isFavorite ? 'heart' : 'heart-outline'}
            color={isFavorite ? colors.favorite : colors.text}
            label={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
            onPress={toggleFavorite}
          />
        </View>
      </View>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <ActionButton icon="call" label="Call" flex={1} onPress={callOwner} />
        <ActionButton
          icon="chatbubble-ellipses"
          label="Message"
          flex={1.25}
          onPress={() => comingSoon('Messaging')}
        />
        <ActionButton
          icon="calendar-outline"
          label="Request Visit"
          primary
          flex={1.55}
          onPress={() => comingSoon('Visit booking')}
        />
      </View>
    </View>
  );
}

function CircleButton({
  icon,
  label,
  onPress,
  color = colors.text,
}: {
  icon: IoniconName;
  label: string;
  onPress: () => void;
  color?: string;
}) {
  return (
    <Pressable onPress={onPress} style={styles.circle} accessibilityRole="button" accessibilityLabel={label}>
      <Ionicons name={icon} size={22} color={color} />
    </Pressable>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
  primary,
  flex,
}: {
  icon: IoniconName;
  label: string;
  onPress: () => void;
  primary?: boolean;
  /** Relative width, so "Request Visit" gets the most room. */
  flex: number;
}) {
  const color = primary ? colors.white : colors.primaryDeep;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        { flex },
        primary ? styles.actionPrimary : styles.actionOutline,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
    >
      <Ionicons name={icon} size={18} color={color} />
      <AppText variant="bodyBold" style={[styles.actionLabel, { color }]} numberOfLines={1}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, padding: spacing.xl },
  scroll: { paddingBottom: spacing.xxl },
  flex: { flex: 1 },
  bold: { fontWeight: '700' },
  body: { paddingHorizontal: SCREEN_PADDING, paddingTop: spacing.md, gap: spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  title: { flex: 1, fontSize: 24, lineHeight: 30, fontWeight: '800', color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap' },
  rent: { fontSize: 26, lineHeight: 34, fontWeight: '800', color: colors.primaryDeep },
  perMonth: { fontSize: 18, fontWeight: '600', color: colors.primaryDeep },
  negotiable: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
  },
  specs: { flexDirection: 'row', marginTop: spacing.sm },
  spec: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  specDivider: { borderLeftWidth: 1, borderLeftColor: colors.border },
  separator: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  description: { lineHeight: 23 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
  },
  details: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: { width: 110 },
  detailValue: { flex: 1, fontWeight: '600', textAlign: 'right' },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    marginVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  topBar: {
    position: 'absolute',
    left: SCREEN_PADDING,
    right: SCREEN_PADDING,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topRight: { flexDirection: 'row', gap: spacing.md },
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
  bottomBar: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 2,
    height: 52,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
  },
  actionLabel: { fontSize: 14 },
  actionOutline: { borderWidth: 1.5, borderColor: colors.primaryDeep, backgroundColor: colors.white },
  actionPrimary: { backgroundColor: colors.primaryDeep },
  pressed: { opacity: 0.85 },
});