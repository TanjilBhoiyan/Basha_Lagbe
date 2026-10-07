import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
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
});