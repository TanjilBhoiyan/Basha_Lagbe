import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

/** "Property Title *" */
export function FieldLabel({ children, required }: { children: string; required?: boolean }) {
  return (
    <AppText variant="bodyBold" style={styles.label}>
      {children}
      {required ? <AppText style={styles.star}> *</AppText> : null}
    </AppText>
  );
}

/** Helper / error text on the left, "0/100" counter on the right. */
export function FieldFooter({
  error,
  hint,
  count,
  max,
}: {
  error?: string;
  hint?: string;
  count?: number;
  max?: number;
}) {
  if (!error && !hint && max === undefined) return null;
  return (
    <View style={styles.footer}>
      <AppText variant="caption" color={error ? 'danger' : 'textSecondary'} style={styles.flex}>
        {error ?? hint ?? ''}
      </AppText>
      {max !== undefined ? (
        <AppText variant="caption" color="textMuted">
          {count ?? 0}/{max}
        </AppText>
      ) : null}
    </View>
  );
}

/** Looks like an input; opens a bottom sheet to pick a value. */
export function SelectField({
  icon,
  placeholder,
  value,
  error,
  onPress,
  accessibilityLabel,
}: {
  icon: IconName;
  placeholder: string;
  value?: string;
  error?: string;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <>
      <Pressable
        onPress={onPress}
        style={[styles.field, { borderColor: error ? colors.danger : colors.border }]}
        accessibilityRole="button"
        accessibilityLabel={`${accessibilityLabel}${value ? `: ${value}` : ''}`}
      >
        <MaterialCommunityIcons name={icon} size={22} color={colors.textSecondary} />
        <AppText style={styles.flex} color={value ? 'text' : 'textMuted'}>
          {value ?? placeholder}
        </AppText>
        <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
      </Pressable>
      <FieldFooter error={error} />
    </>
  );
}

/** Row of equal boxes, e.g. 1 / 2 / 3 / 4+ or Furnished / Semi / Unfurnished. */
export function ChoiceRow<T extends string | number>({
  options,
  value,
  onChange,
  error,
  accessibilityLabel,
}: {
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
  error?: string;
  accessibilityLabel: string;
}) {
  return (
    <>
      <View style={styles.choiceRow} accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <Pressable
              key={String(o.value)}
              onPress={() => onChange(o.value)}
              style={[styles.choice, selected && styles.choiceOn, !!error && !selected && styles.choiceError]}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
            >
              <AppText
                variant={selected ? 'bodyBold' : 'body'}
                color={selected ? 'primaryDeep' : 'text'}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {o.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      <FieldFooter error={error} />
    </>
  );
}

/** White card with a step title and subtitle ("Property Details — Provide detailed..."). */
export function StepCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <AppText style={styles.cardTitle} accessibilityRole="header">
          {title}
        </AppText>
        <AppText variant="caption" color="textSecondary">
          {subtitle}
        </AppText>
      </View>
      {children}
    </View>
  );
}

/** Small bold heading inside a step card ("Rent Terms"). */
export function GroupTitle({ icon, children }: { icon: IconName; children: string }) {
  return (
    <View style={styles.group}>
      <MaterialCommunityIcons name={icon} size={20} color={colors.primary} />
      <AppText variant="bodyBold" style={styles.groupText}>
        {children}
      </AppText>
    </View>
  );
}

export function FieldIcon({ name }: { name: IconName }) {
  return <MaterialCommunityIcons name={name} size={22} color={colors.textSecondary} />;
}

const styles = StyleSheet.create({
  label: { marginBottom: spacing.sm },
  star: { color: colors.danger, fontWeight: '700' },
  footer: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  flex: { flex: 1 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 54,
    paddingHorizontal: spacing.md,
    borderWidth: 1.5,
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },
  choiceRow: { flexDirection: 'row', gap: spacing.sm },
  choice: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceOn: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  choiceError: { borderColor: colors.danger },
  card: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.lg,
  },
  cardHead: { gap: 2 },
  cardTitle: { fontSize: 22, lineHeight: 28, fontWeight: '800', color: colors.text },
  group: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  groupText: { fontSize: 17 },
});