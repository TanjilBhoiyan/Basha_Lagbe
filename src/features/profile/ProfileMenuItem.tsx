import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

type Props = {
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  onPress: () => void;
  /** Small pill on the right, e.g. "Verified". */
  badge?: { text: string; color: string; background: string };
  danger?: boolean;
};

export function ProfileMenuItem({ icon, label, onPress, badge, danger }: Props) {
  const tint = danger ? colors.danger : colors.primaryDeep;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, danger && styles.danger, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={badge ? `${label}, ${badge.text}` : label}
    >
      <MaterialCommunityIcons name={icon} size={26} color={tint} />
      <AppText style={[styles.label, danger && { color: colors.danger }]}>{label}</AppText>
      {badge ? (
        <View style={[styles.badge, { backgroundColor: badge.background }]}>
          <AppText variant="caption" style={[styles.badgeText, { color: badge.color }]}>
            {badge.text}
          </AppText>
        </View>
      ) : null}
      <Ionicons name="chevron-forward" size={20} color={danger ? colors.danger : colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    minHeight: 60,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  danger: { backgroundColor: colors.dangerLight, borderColor: colors.dangerLight },
  pressed: { opacity: 0.8 },
  label: { flex: 1, fontSize: 16, fontWeight: '500', color: colors.text },
  badge: { paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.full },
  badgeText: { fontWeight: '700' },
});