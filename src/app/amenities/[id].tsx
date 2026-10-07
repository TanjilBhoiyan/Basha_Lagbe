import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState, type ComponentProps } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, EmptyState } from '@/components/ui';
import {
  AMENITY_OPTIONS,
  formatIsoDate,
  FURNISHING_OPTIONS,
  TENANT_OPTIONS,
} from '@/features/filters/filters';
import { PropertyListCard } from '@/features/search/PropertyListCard';
import { propertyService } from '@/services/propertyService';
import { colors, radius, SCREEN_PADDING, spacing } from '@/theme';
import type { Property } from '@/types/property';
import { floorLabel, formatTaka, plural } from '@/utils/format';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type InfoRow = { icon: IconName; label: string; value: string; highlight?: boolean };

function rentalRows(p: Property): InfoRow[] {
  const furnishing = FURNISHING_OPTIONS.find((f) => f.value === p.furnishing)?.label ?? '—';
  const tenants = TENANT_OPTIONS.filter((t) => p.tenantTypes.includes(t.value))
    .map((t) => t.label.replace('\n', ' '))
    .join(', ');
  const months = (n: number) =>
    n > 0 ? `${formatTaka(p.monthlyRent * n)} (${plural(n, 'month')})` : 'None';

  return [
    { icon: 'cash-multiple', label: 'Monthly Rent', value: formatTaka(p.monthlyRent), highlight: true },
    { icon: 'handshake-outline', label: 'Negotiable', value: p.negotiable ? 'Yes' : 'No' },
    { icon: 'shield-outline', label: 'Security Deposit', value: months(p.securityDepositMonths) },
    { icon: 'cash-plus', label: 'Advance', value: months(p.advanceMonths) },
    {
      icon: 'file-document-outline',
      label: 'Service Charge',
      value: p.serviceCharge > 0 ? `${formatTaka(p.serviceCharge)} / month` : 'Included',
    },
    {
      icon: 'flash',
      label: 'Utility Cost',
      value: p.utilityCost === 'included' ? 'Included in rent' : 'As per usage',
    },
    { icon: 'calendar-check', label: 'Available From', value: formatIsoDate(p.availableFrom) },
    { icon: 'clock-outline', label: 'Minimum Duration', value: plural(p.minStayMonths, 'month') },
    { icon: 'sofa-outline', label: 'Furnishing', value: furnishing },
    {
      icon: 'office-building',
      label: 'Floor',
      value: `${floorLabel(p.floorNumber)} of ${p.totalFloors}`,
    },
    { icon: 'account-group', label: 'Suitable For', value: tenants || 'Anyone' },
  ];
}

export default function AmenitiesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    propertyService.getById(id).then((p) => {
      setProperty(p);
      setLoading(false);
    });
  }, [id]);

  const goBack = () =>
    router.canGoBack()
      ? router.back()
      : router.replace({ pathname: '/property/[id]', params: { id } });

  // 3 tiles per row inside the card.
  const inner = width - SCREEN_PADDING * 2 - spacing.lg * 2 - 2;
  const tileWidth = Math.floor((inner - spacing.sm * 2) / 3);

  // Available amenities first, then the ones this property doesn't have (faded).
  const amenities = property
    ? [
        ...AMENITY_OPTIONS.filter((a) => property.amenities.includes(a.value)),
        ...AMENITY_OPTIONS.filter((a) => !property.amenities.includes(a.value)),
      ]
    : [];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={goBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </Pressable>
        <AppText style={styles.title} accessibilityRole="header">
          Amenities & Info
        </AppText>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : !property ? (
        <EmptyState
          icon="home-outline"
          title="This listing is no longer available"
          actionLabel="Go back"
          onAction={goBack}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <PropertyListCard property={property} onPress={goBack} />

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <AppText variant="h3">Amenities</AppText>
              <AppText variant="caption" color="textSecondary">
                {property.amenities.length} of {AMENITY_OPTIONS.length} available
              </AppText>
            </View>
            <View style={styles.grid}>
              {amenities.map((a) => {
                const has = property.amenities.includes(a.value);
                return (
                  <View
                    key={a.value}
                    style={[styles.tile, { width: tileWidth }, !has && styles.tileOff]}
                    accessibilityLabel={`${a.label}: ${has ? 'available' : 'not available'}`}
                  >
                    {has ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={colors.primary}
                        style={styles.check}
                      />
                    ) : null}
                    <View style={[styles.iconCircle, !has && styles.iconCircleOff]}>
                      <MaterialCommunityIcons
                        name={a.icon}
                        size={24}
                        color={has ? colors.primaryDeep : colors.textMuted}
                      />
                    </View>
                    <AppText
                      variant="caption"
                      align="center"
                      numberOfLines={2}
                      style={has ? styles.tileLabel : styles.tileLabelOff}
                    >
                      {a.label}
                    </AppText>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.card}>
            <AppText variant="h3">Rental Information</AppText>
            {rentalRows(property).map((row, i, all) => (
              <View key={row.label} style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <MaterialCommunityIcons name={row.icon} size={20} color={colors.primaryDeep} />
                </View>
                <View style={[styles.infoBody, i < all.length - 1 && styles.infoDivider]}>
                  <AppText variant="caption" color="textSecondary" style={styles.infoLabel}>
                    {row.label}
                  </AppText>
                  <AppText
                    variant={row.highlight ? 'bodyBold' : 'caption'}
                    color={row.highlight ? 'primaryDeep' : 'text'}
                    style={[styles.infoValue, row.highlight && styles.infoValueBig]}
                  >
                    {row.value}
                  </AppText>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundMint },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: SCREEN_PADDING,
    paddingVertical: spacing.md,
  },
  title: { fontSize: 26, lineHeight: 32, fontWeight: '800', color: colors.text },
  loader: { marginTop: spacing.xxl },
  content: { paddingHorizontal: SCREEN_PADDING, paddingBottom: spacing.xl, gap: spacing.md },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: {
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tileOff: { opacity: 0.55, backgroundColor: colors.white },
  check: { position: 'absolute', top: 6, right: 6 },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleOff: { backgroundColor: colors.border },
  tileLabel: { color: colors.text, fontWeight: '500' },
  tileLabelOff: { color: colors.textMuted, textDecorationLine: 'line-through' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  infoDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  infoLabel: { flex: 1, fontSize: 14 },
  infoValue: { flexShrink: 1, textAlign: 'right', fontWeight: '600', fontSize: 14 },
  infoValueBig: { fontSize: 18, fontWeight: '800' },
});