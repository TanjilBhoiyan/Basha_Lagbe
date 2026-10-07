import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, OptionSheet, RangeSlider } from '@/components/ui';
import {
  AMENITY_OPTIONS,
  availableByOptions,
  DEFAULT_FILTERS,
  formatIsoDate,
  FURNISHING_OPTIONS,
  PRICE_LABEL_STEPS,
  PRICE_STEPS,
  TENANT_OPTIONS,
  type PropertyFilters,
} from '@/features/filters/filters';
import {
  CheckTile,
  FilterSection,
  IconTile,
  NumberChoice,
  PillChoice,
} from '@/features/filters/FilterControls';
import { useFilters } from '@/features/filters/FiltersContext';
import { HOME_CATEGORIES } from '@/features/home/categories';
import { propertyService } from '@/services/propertyService';
import { colors, radius, SCREEN_PADDING, spacing } from '@/theme';
import type { Amenity } from '@/types/property';
import { formatBdNumber } from '@/utils/format';

const LAST_STEP = PRICE_STEPS.length - 1;
const PROPERTY_TYPES = HOME_CATEGORIES.filter((c) => c.type !== null);

function nearestStep(value: number) {
  let best = 0;
  PRICE_STEPS.forEach((v, i) => {
    if (Math.abs(v - value) < Math.abs(PRICE_STEPS[best] - value)) best = i;
  });
  return best;
}

function priceSummary(f: PropertyFilters) {
  if (f.minRent === 0 && f.maxRent === null) return 'Any price';
  const max = f.maxRent === null ? `৳${formatBdNumber(PRICE_STEPS[LAST_STEP])}+` : `৳${formatBdNumber(f.maxRent)}`;
  return `৳${formatBdNumber(f.minRent)} – ${max}`;
}

export default function FiltersScreen() {
  const { width } = useWindowDimensions();
  const { filters, setFilters } = useFilters();

  // Edit a draft; nothing changes for the rest of the app until "Apply".
  const [draft, setDraft] = useState<PropertyFilters>(filters);
  const [count, setCount] = useState<number | null>(null);
  const [dateSheetOpen, setDateSheetOpen] = useState(false);

  const update = (patch: Partial<PropertyFilters>) => setDraft((d) => ({ ...d, ...patch }));

  useEffect(() => {
    setCount(null);
    const timer = setTimeout(() => propertyService.count(draft).then(setCount), 200);
    return () => clearTimeout(timer);
  }, [draft]);

  // Card content width (screen padding, card padding and 1px borders removed).
  const inner = width - SCREEN_PADDING * 2 - spacing.lg * 2 - 2;
  // Never narrower than 80, so labels like "Professionals" fit; rows scroll if needed.
  const tileWidth = Math.max((inner - spacing.sm * 4) / 5, 80);
  // 3 amenity columns on wide phones, 2 on narrower ones so labels are not cut off.
  const amenityColumns = inner >= 380 ? 3 : 2;
  const checkWidth = Math.floor((inner - spacing.sm * (amenityColumns - 1)) / amenityColumns);

  const lowIndex = nearestStep(draft.minRent);
  const highIndex = draft.maxRent === null ? LAST_STEP : nearestStep(draft.maxRent);

  const toggleAmenity = (a: Amenity) =>
    update({
      amenities: draft.amenities.includes(a)
        ? draft.amenities.filter((x) => x !== a)
        : [...draft.amenities, a],
    });

  const close = () => (router.canGoBack() ? router.back() : router.replace('/home'));

  const apply = () => {
    setFilters(draft);
    close();
  };

  const dateOptions = availableByOptions();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={close} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close filters">
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </Pressable>
        <AppText style={styles.title} accessibilityRole="header">
          Filters
        </AppText>
        <Pressable
          onPress={() => setDraft(DEFAULT_FILTERS)}
          hitSlop={10}
          style={styles.reset}
          accessibilityRole="button"
          accessibilityLabel="Reset all filters"
        >
          <MaterialCommunityIcons name="refresh" size={22} color={colors.primary} />
          <AppText variant="bodyBold" color="primaryDeep">
            Reset
          </AppText>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <FilterSection
          title={
            <AppText variant="h3">
              Price Range{' '}
              <AppText variant="bodyBold" style={styles.unit}>
                (Tk / month)
              </AppText>
            </AppText>
          }
          right={
            <AppText variant="caption" color="primaryDeep" style={styles.bold}>
              {priceSummary(draft)}
            </AppText>
          }
        >
          <RangeSlider
            steps={PRICE_STEPS.length}
            low={lowIndex}
            high={highIndex}
            onChange={(lo, hi) =>
              update({ minRent: PRICE_STEPS[lo], maxRent: hi === LAST_STEP ? null : PRICE_STEPS[hi] })
            }
          />
          <View style={styles.priceLabels}>
            {PRICE_LABEL_STEPS.map((v) => {
              const pct = (PRICE_STEPS.indexOf(v) / LAST_STEP) * 100;
              return (
                <AppText
                  key={v}
                  variant="small"
                  color="textSecondary"
                  align="center"
                  style={[styles.priceLabel, { left: `${pct}%` }]}
                >
                  {v === 0 ? '0' : `${v / 1000}K${v === PRICE_STEPS[LAST_STEP] ? '+' : ''}`}
                </AppText>
              );
            })}
          </View>
        </FilterSection>

        <FilterSection title="Property Type">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tileRow}>
            {PROPERTY_TYPES.map((c) => (
              <IconTile
                key={c.label}
                label={c.label}
                icon={c.icon}
                width={tileWidth}
                selected={draft.type === c.type}
                onPress={() => update({ type: draft.type === c.type ? null : c.type })}
              />
            ))}
          </ScrollView>
        </FilterSection>

        <FilterSection title="Tenant Type">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tileRow}>
            {TENANT_OPTIONS.map((t) => (
              <IconTile
                key={t.value}
                label={t.label}
                icon={t.icon}
                width={tileWidth}
                selected={draft.tenantType === t.value}
                onPress={() => update({ tenantType: draft.tenantType === t.value ? null : t.value })}
              />
            ))}
          </ScrollView>
        </FilterSection>

        <FilterSection title="Bedrooms">
          <NumberChoice value={draft.bedrooms} onChange={(v) => update({ bedrooms: v })} />
        </FilterSection>

        <FilterSection title="Bathrooms">
          <NumberChoice value={draft.bathrooms} onChange={(v) => update({ bathrooms: v })} />
        </FilterSection>

        <FilterSection title="Furnishing">
          <View style={styles.wrapRow}>
            <PillChoice
              label="Any"
              selected={draft.furnishing === null}
              onPress={() => update({ furnishing: null })}
            />
            {FURNISHING_OPTIONS.map((o) => (
              <PillChoice
                key={o.value}
                label={o.label}
                icon={o.icon}
                selected={draft.furnishing === o.value}
                onPress={() => update({ furnishing: o.value })}
              />
            ))}
          </View>
        </FilterSection>

        <FilterSection title="Amenities">
          <View style={styles.wrapRow}>
            {AMENITY_OPTIONS.map((a) => (
              <CheckTile
                key={a.value}
                label={a.label}
                icon={a.icon}
                width={checkWidth}
                checked={draft.amenities.includes(a.value)}
                onPress={() => toggleAmenity(a.value)}
              />
            ))}
          </View>
        </FilterSection>

        <FilterSection title="Available From">
          <Pressable
            onPress={() => setDateSheetOpen(true)}
            style={styles.dateField}
            accessibilityRole="button"
            accessibilityLabel="Select move-in date"
          >
            <MaterialCommunityIcons name="calendar-month-outline" size={22} color={colors.textSecondary} />
            <AppText style={styles.flex} color={draft.availableBy ? 'text' : 'textMuted'}>
              {draft.availableBy ? `By ${formatIsoDate(draft.availableBy)}` : 'Select date'}
            </AppText>
            <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
          </Pressable>
        </FilterSection>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={apply}
          style={({ pressed }) => [styles.apply, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`Apply filters, ${count ?? ''} properties`}
        >
          <AppText variant="bodyBold" style={styles.applyTitle}>
            Apply Filters
          </AppText>
          <AppText variant="caption" style={styles.applyCount}>
            {count === null
              ? 'Counting…'
              : count === 0
                ? 'No properties match'
                : `${formatBdNumber(count)} ${count === 1 ? 'property' : 'properties'}`}
          </AppText>
        </Pressable>
      </View>

      <OptionSheet
        visible={dateSheetOpen}
        title="Available From"
        options={dateOptions}
        value={draft.availableBy}
        onSelect={(v) => update({ availableBy: v })}
        onClose={() => setDateSheetOpen(false)}
      />
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
  title: { flex: 1, fontSize: 26, lineHeight: 32, fontWeight: '800', color: colors.primaryDeep },
  reset: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  content: { paddingHorizontal: SCREEN_PADDING, paddingBottom: spacing.xl, gap: spacing.md },
  unit: { fontWeight: '500' },
  bold: { fontWeight: '700' },
  priceLabels: { height: 18, marginHorizontal: 13 },
  priceLabel: { position: 'absolute', width: 44, marginLeft: -22 },
  tileRow: { flexDirection: 'row', gap: spacing.sm },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    height: 52,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  flex: { flex: 1 },
  footer: { paddingHorizontal: SCREEN_PADDING, paddingVertical: spacing.md },
  apply: {
    minHeight: 60,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  applyTitle: { color: colors.white, fontSize: 17 },
  applyCount: { color: colors.white, opacity: 0.9 },
  pressed: { opacity: 0.85 },
});