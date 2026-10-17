import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { AMENITY_OPTIONS, FURNISHING_OPTIONS } from '@/features/filters/filters';
import { colors, radius, spacing } from '@/theme';
import { floorLabel, formatTaka } from '@/utils/format';
import {
  availableFromOptions,
  FACING_OPTIONS,
  formatDraftDate,
  hasBedrooms,
  PROPERTY_TYPE_OPTIONS,
  RENTAL_CATEGORY_OPTIONS,
  type PropertyDraft,
} from './draft';
import { StepCard } from './FormFields';

type Props = {
  draft: PropertyDraft;
  /** Jump back to a step (0-based) to change something. */
  onEdit: (step: number) => void;
  /** Editing an existing listing (changes the note at the bottom). */
  editing?: boolean;
};

type Row = [label: string, value: string];

export function PreviewStep({ draft: d, onEdit, editing }: Props) {
  const label = <T,>(options: { value: T; label: string }[], value: T | null) =>
    options.find((o) => o.value === value)?.label ?? '—';
  const months = (n: number) => (n ? `${n} month${n === 1 ? '' : 's'}` : 'None');
  const rightAway = availableFromOptions()[0];

  const basic: Row[] = [
    ['Property Title', d.title.trim()],
    ['Rent For', label(RENTAL_CATEGORY_OPTIONS, d.rentalCategory)],
    ['Area', d.areaName.trim() || '—'],
    ['Address', d.address.trim()],
    ['Price', d.monthlyRent ? `${formatTaka(d.monthlyRent)} / month` : '—'],
  ];

  const details: Row[] = [
    ['Property Type', label(PROPERTY_TYPE_OPTIONS, d.type)],
    ...(hasBedrooms(d.type) ? [['Bedrooms', d.bedrooms === 4 ? '4+' : String(d.bedrooms ?? '—')] as Row] : []),
    ['Bathrooms', d.bathrooms === 4 ? '4+' : String(d.bathrooms ?? '—')],
    ...(hasBedrooms(d.type) ? [['Balconies', d.balconies === 3 ? '3+' : String(d.balconies ?? '—')] as Row] : []),
    ['Size', d.sizeSqft ? `${d.sizeSqft} Sq. Ft.` : '—'],
    ['Floor', d.floorNumber === null ? '—' : `${floorLabel(d.floorNumber)} of ${d.totalFloors ?? '—'}`],
    ['Facing', d.facing ? label(FACING_OPTIONS, d.facing) : 'Not set'],
    ['Furnishing', label(FURNISHING_OPTIONS, d.furnishing)],
    [
      'Available From',
      !d.availableFrom ? '—' : d.availableFrom <= rightAway.value ? 'Right away' : formatDraftDate(d.availableFrom),
    ],
  ];

  const terms: Row[] = [
    ['Negotiable', d.negotiable ? 'Yes' : 'No'],
    ['Advance', months(d.advanceMonths)],
    ['Service Charge', d.serviceCharge ? `${formatTaka(d.serviceCharge)} / month` : 'None'],
    ['Utility Bills', d.utilityCost === 'included' ? 'Included in rent' : 'Paid separately'],
    ['Minimum Stay', d.minStayMonths ? months(d.minStayMonths) : 'Any'],
  ];

  const amenities = AMENITY_OPTIONS.filter((a) => d.amenities.includes(a.value)).map((a) => a.label);

  return (
    <StepCard
      title={editing ? 'Preview & Save' : 'Preview & Submit'}
      subtitle={editing ? 'Check your changes before saving' : 'Review your property details before submitting'}
    >
      {d.photos[0] ? (
        <View>
          <Image source={{ uri: d.photos[0].uri }} style={styles.hero} accessibilityLabel="Cover photo" />
          <View style={styles.count}>
            <Ionicons name="camera" size={14} color={colors.white} />
            <AppText variant="small" style={styles.countText}>
              {d.photos.length} {d.photos.length === 1 ? 'Photo' : 'Photos'}
            </AppText>
          </View>
        </View>
      ) : null}

      <Section title="Basic Information" rows={basic} onEdit={() => onEdit(0)} />
      <Section title="Property Details" rows={details} onEdit={() => onEdit(1)} />
      <Section title="Rent Terms" rows={terms} onEdit={() => onEdit(1)} />
      <Section
        title="Facilities"
        rows={[['Included', amenities.length ? amenities.join(', ') : 'None selected']]}
        onEdit={() => onEdit(2)}
      />

      {d.description.trim() ? (
        <View style={styles.section}>
          <AppText variant="bodyBold">Description</AppText>
          <AppText variant="caption" color="textSecondary">
            {d.description.trim()}
          </AppText>
        </View>
      ) : null}

      {editing ? null : (
        <View style={styles.note}>
          <MaterialCommunityIcons name="shield-check-outline" size={22} color={colors.info} />
          <AppText variant="caption" style={styles.noteText}>
            Your listing goes{' '}
            <AppText variant="caption" style={styles.bold}>
              live right away
            </AppText>{' '}
            after you submit. You can mark it as rented or delete it anytime from your dashboard.
          </AppText>
        </View>
      )}
    </StepCard>
  );
}

function Section({ title, rows, onEdit }: { title: string; rows: Row[]; onEdit: () => void }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <AppText variant="bodyBold">{title}</AppText>
        <Pressable
          onPress={onEdit}
          style={styles.edit}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Edit ${title}`}
        >
          <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.primary} />
          <AppText variant="caption" color="primary" style={styles.bold}>
            Edit
          </AppText>
        </Pressable>
      </View>
      {rows.map(([k, v]) => (
        <View key={k} style={styles.row}>
          <AppText variant="caption" color="textSecondary" style={styles.key}>
            {k}
          </AppText>
          <AppText variant="caption" style={styles.value}>
            {v}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { width: '100%', height: 190, borderRadius: radius.lg, backgroundColor: colors.surface },
  count: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  countText: { color: colors.white, fontWeight: '700' },
  section: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  edit: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  row: { flexDirection: 'row', gap: spacing.md },
  key: { width: 112 },
  value: { flex: 1, color: colors.text },
  bold: { fontWeight: '700' },
  note: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.infoLight,
  },
  noteText: { flex: 1, color: colors.text },
});