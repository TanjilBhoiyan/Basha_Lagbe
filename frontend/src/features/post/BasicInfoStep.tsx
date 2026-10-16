import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Input, OptionSheet } from '@/components/ui';
import { pinResult } from '@/features/map/pinResult';
import { areaNameOf } from '@/features/map/placeName';
import { colors, radius, spacing } from '@/theme';
import { locationLabel } from '@/types/location';
import { formatBdNumber } from '@/utils/format';
import {
  ADDRESS_MAX,
  AREA_MAX,
  PROPERTY_TYPE_OPTIONS,
  RENTAL_CATEGORY_OPTIONS,
  TITLE_MAX,
  type DraftErrors,
  type PropertyDraft,
} from './draft';
import { FieldFooter, FieldIcon, FieldLabel, SelectField } from './FormFields';
import { LocationPinField } from './LocationPinField';

type Props = {
  draft: PropertyDraft;
  errors: DraftErrors;
  onChange: (patch: Partial<PropertyDraft>) => void;
};

export function BasicInfoStep({ draft, errors, onChange }: Props) {
  const [sheet, setSheet] = useState<'type' | 'category' | null>(null);
  const [findingArea, setFindingArea] = useState(false);

  // Back from the map picker with a new pin: save it, then fill the area from the pin (owner can edit it).
  useFocusEffect(
    useCallback(() => {
      const pin = pinResult.take();
      if (!pin) return;
      onChange({ latitude: pin.latitude, longitude: pin.longitude, pinLabel: locationLabel(pin) });
      setFindingArea(true);
      areaNameOf(pin)
        .then((area) => {
          if (area) onChange({ latitude: pin.latitude, longitude: pin.longitude, pinLabel: locationLabel(pin), areaName: area });
        })
        .finally(() => setFindingArea(false));
    }, [onChange]),
  );

  const openPicker = () =>
    router.push({
      pathname: '/pick-location',
      params:
        draft.latitude !== null && draft.longitude !== null
          ? { mode: 'post', lat: String(draft.latitude), lng: String(draft.longitude) }
          : { mode: 'post' },
    });

  const typeLabel = PROPERTY_TYPE_OPTIONS.find((o) => o.value === draft.type)?.label;
  const categoryLabel = RENTAL_CATEGORY_OPTIONS.find((o) => o.value === draft.rentalCategory)?.label;

  const onRentChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '').slice(0, 8);
    onChange({ monthlyRent: digits ? Number(digits) : null });
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIcon}>
          <MaterialCommunityIcons name="home-city" size={34} color={colors.primaryDeep} />
        </View>
        <View style={styles.flex}>
          <AppText style={styles.cardTitle}>Basic Information</AppText>
          <AppText variant="caption" color="textSecondary">
            Let’s start with the basic details about your property. This information will help
            tenants find your listing.
          </AppText>
        </View>
      </View>

      <View>
        <FieldLabel required>Property Title</FieldLabel>
        <Input
          value={draft.title}
          onChangeText={(title) => onChange({ title })}
          placeholder="e.g. Modern Apartment in Mirpur"
          maxLength={TITLE_MAX}
          prefix={<FieldIcon name="file-document-outline" />}
          accessibilityLabel="Property title"
          error={errors.title}
        />
        <FieldFooter count={draft.title.length} max={TITLE_MAX} />
      </View>

      <View>
        <FieldLabel required>Property Type</FieldLabel>
        <SelectField
          icon="office-building-outline"
          placeholder="Select property type"
          value={typeLabel}
          error={errors.type}
          onPress={() => setSheet('type')}
          accessibilityLabel="Property type"
        />
      </View>

      <View>
        <FieldLabel required>Rental Category</FieldLabel>
        <SelectField
          icon="tag-outline"
          placeholder="Select rental category"
          value={categoryLabel}
          error={errors.rentalCategory}
          onPress={() => setSheet('category')}
          accessibilityLabel="Rental category"
        />
      </View>

      <View>
        <FieldLabel required>Location on Map</FieldLabel>
        <LocationPinField
          latitude={draft.latitude}
          longitude={draft.longitude}
          label={draft.pinLabel}
          error={errors.latitude}
          onPress={openPicker}
        />
      </View>

      <View>
        <FieldLabel required>Area</FieldLabel>
        <Input
          value={draft.areaName}
          onChangeText={(areaName) => onChange({ areaName })}
          placeholder={findingArea ? 'Finding area…' : 'e.g. Mohakhali'}
          maxLength={AREA_MAX}
          prefix={<FieldIcon name="map-marker-radius-outline" />}
          accessibilityLabel="Area"
          error={errors.areaName}
        />
        <FieldFooter hint="Filled from the pin. Change it if it's not right." />
      </View>

      <View>
        <FieldLabel required>Address</FieldLabel>
        <Input
          value={draft.address}
          onChangeText={(address) => onChange({ address })}
          placeholder="House, road, block, nearby landmark"
          maxLength={ADDRESS_MAX}
          multiline
          textAlignVertical="top"
          style={styles.address}
          prefix={<FieldIcon name="map-marker" />}
          accessibilityLabel="Address"
          error={errors.address}
        />
        <FieldFooter
          hint="Only the area is shown publicly. The full address stays private."
          count={draft.address.length}
          max={ADDRESS_MAX}
        />
      </View>

      <View>
        <FieldLabel required>Monthly Rent (৳)</FieldLabel>
        <Input
          value={draft.monthlyRent === null ? '' : formatBdNumber(draft.monthlyRent)}
          onChangeText={onRentChange}
          placeholder="Enter monthly rent amount"
          keyboardType="number-pad"
          prefix={<AppText style={styles.taka}>৳</AppText>}
          accessibilityLabel="Monthly rent in taka"
          error={errors.monthlyRent}
        />
      </View>

      <OptionSheet
        visible={sheet === 'type'}
        title="Property Type"
        options={PROPERTY_TYPE_OPTIONS}
        value={draft.type ?? undefined}
        onSelect={(type) => onChange({ type })}
        onClose={() => setSheet(null)}
      />
      <OptionSheet
        visible={sheet === 'category'}
        title="Who can rent?"
        options={RENTAL_CATEGORY_OPTIONS}
        value={draft.rentalCategory ?? undefined}
        onSelect={(rentalCategory) => onChange({ rentalCategory })}
        onClose={() => setSheet(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.lg,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 22, lineHeight: 28, fontWeight: '800', color: colors.primaryDeep },
  flex: { flex: 1 },
  address: { minHeight: 64 },
  taka: { fontSize: 20, fontWeight: '700', color: colors.textSecondary },
});