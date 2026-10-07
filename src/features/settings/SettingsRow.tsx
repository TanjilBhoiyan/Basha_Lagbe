import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

/** White rounded card that groups rows with thin dividers. */
export function SettingsGroup({ children, danger }: { children: ReactNode; danger?: boolean }) {
  return <View style={[styles.group, danger && styles.groupDanger]}>{children}</View>;
}

type RowProps = {
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  /** Current value shown on the right, e.g. "English". */
  value?: string;
  onPress: () => void;
  danger?: boolean;
  /** Draw a divider above this row (all rows except the first in a group). */
  divider?: boolean;
};

export function SettingsRow({ icon, label, value, onPress, danger, divider }: RowProps) {
  const tint = danger ? colors.danger : colors.primaryDeep;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, divider && styles.divider, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
    >
      <View style={[styles.iconBox, danger && styles.iconBoxDanger]}>
        <MaterialCommunityIcons name={icon} size={24} color={tint} />
      </View>
      <AppText style={[styles.label, danger && { color: colors.danger }]}>{label}</AppText>
      {value ? (
        <AppText color="textSecondary" numberOfLines={1} style={styles.value}>
          {value}
        </AppText>
      ) : null}
      <Ionicons name="chevron-forward" size={20} color={danger ? colors.danger : colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  group: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  groupDanger: { backgroundColor: colors.dangerLight, borderColor: '#FECACA' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 64,
    paddingHorizontal: spacing.md,
  },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  pressed: { backgroundColor: colors.surface },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxDanger: { backgroundColor: '#FECACA' },
  label: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
  value: { maxWidth: 130 },
});