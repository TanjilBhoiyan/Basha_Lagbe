import { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { AppText, Input, OptionSheet } from '@/components/ui';
import { FURNISHING_OPTIONS } from '@/features/filters/filters';
import { colors, radius, spacing } from '@/theme';
import { formatBdNumber } from '@/utils/format';
import {
  availableFromOptions,
  DESCRIPTION_MAX,
  FACING_OPTIONS,
  FLOOR_OPTIONS,
  formatDraftDate,
  hasBedrooms,
  PROPERTY_TYPE_OPTIONS,
  TOTAL_FLOOR_OPTIONS,
  type DraftErrors,
  type PropertyDraft,
} from './draft';
import { ChoiceRow, FieldFooter, FieldIcon, FieldLabel, GroupTitle, SelectField, StepCard } from './FormFields';

type Props = {
  draft: PropertyDraft;
  errors: DraftErrors;
  onChange: (patch: Partial<PropertyDraft>) => void;
};

type Sheet = 'type' | 'floor' | 'totalFloors' | 'facing' | 'available';

const COUNT_OPTIONS = [
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4+' },
];

const FURNISH_CHOICES = FURNISHING_OPTIONS.map((f) => ({
  value: f.value,
  label: f.value === 'semi-furnished' ? 'Semi' : f.label,
}));

const ADVANCE_CHOICES = [0, 1, 2, 3, 6].map((n) => ({ value: n, label: n ? String(n) : 'None' }));
const MIN_STAY_CHOICES = [
  { value: 0, label: 'Any' },
  { value: 6, label: '6 mo' },
  { value: 12, label: '1 yr' },
  { value: 24, label: '2 yr' },
];

/** Keeps digits only; empty -> null. */
const toNumber = (text: string, maxDigits: number) => {
  const digits = text.replace(/[^0-9]/g, '').slice(0, maxDigits);
  return digits ? Number(digits) : null;
};

export function PropertyDetailsStep({ draft, errors, onChange }: Props) {
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const close = () => setSheet(null);

  const available = availableFromOptions();
  const availableLabel = draft.availableFrom
    ? (available.find((o) => o.value === draft.availableFrom)?.label ?? formatDraftDate(draft.availableFrom))
    : undefined;

  return (
    <StepCard title="Property Details" subtitle="Provide detailed information about your property">
      <View>
        <FieldLabel required>Property Type</FieldLabel>
        <SelectField
          icon="home-outline"
          placeholder="Select property type"
          value={PROPERTY_TYPE_OPTIONS.find((o) => o.value === draft.type)?.label}
          error={errors.type}
          onPress={() => setSheet('type')}
          accessibilityLabel="Property type"
        />
      </View>

      {hasBedrooms(draft.type) ? (
        <View>
          <FieldLabel required>Bedrooms</FieldLabel>
          <ChoiceRow
            options={COUNT_OPTIONS}
            value={draft.bedrooms}
            onChange={(bedrooms) => onChange({ bedrooms })}
            error={errors.bedrooms}
            accessibilityLabel="Bedrooms"
          />
        </View>
      ) : null}

      <View>
        <FieldLabel required>Bathrooms</FieldLabel>
        <ChoiceRow
          options={COUNT_OPTIONS}
          value={draft.bathrooms}
          onChange={(bathrooms) => onChange({ bathrooms })}
          error={errors.bathrooms}
          accessibilityLabel="Bathrooms"
        />
      </View>

      <View>
        <FieldLabel>Size (Sq. Ft.)</FieldLabel>
        <Input
          value={draft.sizeSqft === null ? '' : String(draft.sizeSqft)}
          onChangeText={(t) => onChange({ sizeSqft: toNumber(t, 6) })}
          placeholder="e.g. 1200"
          keyboardType="number-pad"
          prefix={<FieldIcon name="floor-plan" />}
          suffix={<AppText color="textMuted">sqft</AppText>}
          accessibilityLabel="Size in square feet"
          error={errors.sizeSqft}
        />
      </View>

      <View style={styles.row}>
        <View style={styles.flex}>
          <FieldLabel required>Floor</FieldLabel>
          <SelectField
            icon="layers-outline"
            placeholder="Select"
            value={FLOOR_OPTIONS.find((o) => o.value === draft.floorNumber)?.label}
            error={errors.floorNumber}
            onPress={() => setSheet('floor')}
            accessibilityLabel="Floor"
          />
        </View>
        <View style={styles.flex}>
          <FieldLabel required>Total Floors</FieldLabel>
          <SelectField
            icon="office-building-outline"
            placeholder="Select"
            value={draft.totalFloors === null ? undefined : String(draft.totalFloors)}
            error={errors.totalFloors}
            onPress={() => setSheet('totalFloors')}
            accessibilityLabel="Total floors in the building"
          />
        </View>
      </View>

      <View>
        <FieldLabel>Facing</FieldLabel>
        <SelectField
          icon="compass-outline"
          placeholder="Select facing (optional)"
          value={FACING_OPTIONS.find((o) => o.value === draft.facing)?.label}
          onPress={() => setSheet('facing')}
          accessibilityLabel="Facing"
        />
      </View>

      <GroupTitle icon="sofa-outline">More Details</GroupTitle>

      <View>
        <FieldLabel required>Furnishing</FieldLabel>
        <ChoiceRow
          options={FURNISH_CHOICES}
          value={draft.furnishing}
          onChange={(furnishing) => onChange({ furnishing })}
          error={errors.furnishing}
          accessibilityLabel="Furnishing"
        />
      </View>

      <View>
        <FieldLabel required>Available From</FieldLabel>
        <SelectField
          icon="calendar-outline"
          placeholder="Select date"
          value={availableLabel}
          error={errors.availableFrom}
          onPress={() => setSheet('available')}
          accessibilityLabel="Available from"
        />
      </View>

      <GroupTitle icon="cash-multiple">Rent Terms</GroupTitle>

      <View style={styles.toggle}>
        <View style={styles.flex}>
          <AppText variant="bodyBold">Rent is negotiable</AppText>
          <AppText variant="caption" color="textSecondary">
            Tenants can offer a different amount
          </AppText>
        </View>
        <Switch
          value={draft.negotiable}
          onValueChange={(negotiable) => onChange({ negotiable })}
          trackColor={{ true: colors.primary, false: colors.border }}
          thumbColor={colors.white}
          accessibilityLabel="Rent is negotiable"
        />
      </View>

      <View>
        <FieldLabel>Advance (months of rent)</FieldLabel>
        <ChoiceRow
          options={ADVANCE_CHOICES}
          value={draft.advanceMonths}
          onChange={(advanceMonths) => onChange({ advanceMonths })}
          accessibilityLabel="Advance in months"
        />
      </View>

      <View>
        <FieldLabel>Service Charge (per month)</FieldLabel>
        <Input
          value={draft.serviceCharge === null ? '' : formatBdNumber(draft.serviceCharge)}
          onChangeText={(t) => onChange({ serviceCharge: toNumber(t, 6) })}
          placeholder="0 if none"
          keyboardType="number-pad"
          prefix={<AppText style={styles.taka}>৳</AppText>}
          accessibilityLabel="Service charge per month in taka"
        />
      </View>

      <View>
        <FieldLabel>Utility Bills (gas, water, electricity)</FieldLabel>
        <ChoiceRow
          options={[
            { value: 'included', label: 'Included in rent' },
            { value: 'separate', label: 'Paid separately' },
          ]}
          value={draft.utilityCost}
          onChange={(utilityCost) => onChange({ utilityCost })}
          accessibilityLabel="Utility bills"
        />
      </View>

      <View>
        <FieldLabel>Minimum Stay</FieldLabel>
        <ChoiceRow
          options={MIN_STAY_CHOICES}
          value={draft.minStayMonths}
          onChange={(minStayMonths) => onChange({ minStayMonths })}
          accessibilityLabel="Minimum stay"
        />
      </View>

      <View>
        <FieldLabel required>Description</FieldLabel>
        <Input
          value={draft.description}
          onChangeText={(description) => onChange({ description })}
          placeholder="Nearby school, market, main road, sunlight, house rules…"
          maxLength={DESCRIPTION_MAX}
          multiline
          textAlignVertical="top"
          style={styles.description}
          accessibilityLabel="Description"
          error={errors.description}
        />
        <FieldFooter count={draft.description.length} max={DESCRIPTION_MAX} />
      </View>

      <OptionSheet
        visible={sheet === 'type'}
        title="Property Type"
        options={PROPERTY_TYPE_OPTIONS}
        value={draft.type ?? undefined}
        onSelect={(type) => onChange({ type, ...(hasBedrooms(type) ? null : { bedrooms: 0 }) })}
        onClose={close}
      />
      <OptionSheet
        visible={sheet === 'floor'}
        title="Which floor?"
        options={FLOOR_OPTIONS}
        value={draft.floorNumber ?? undefined}
        onSelect={(floorNumber) => onChange({ floorNumber })}
        onClose={close}
      />
      <OptionSheet
        visible={sheet === 'totalFloors'}
        title="Floors in the building"
        options={TOTAL_FLOOR_OPTIONS}
        value={draft.totalFloors ?? undefined}
        onSelect={(totalFloors) => onChange({ totalFloors })}
        onClose={close}
      />
      <OptionSheet
        visible={sheet === 'facing'}
        title="Facing"
        options={FACING_OPTIONS}
        value={draft.facing ?? undefined}
        onSelect={(facing) => onChange({ facing })}
        onClose={close}
      />
      <OptionSheet
        visible={sheet === 'available'}
        title="Available from"
        options={available}
        value={draft.availableFrom ?? undefined}
        onSelect={(availableFrom) => onChange({ availableFrom })}
        onClose={close}
      />
    </StepCard>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: spacing.md },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  taka: { fontSize: 20, fontWeight: '700', color: colors.textSecondary },
  description: { minHeight: 110 },
});