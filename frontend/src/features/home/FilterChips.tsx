import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, radius, SCREEN_PADDING, spacing } from '@/theme';

type Chip = {
  key: string;
  label: string;
  active: boolean;
  onPress: () => void;
  /** The leading "Filters" chip has an icon and no dropdown arrow. */
  leading?: boolean;
};

export function FilterChips({ chips }: { chips: Chip[] }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {chips.map((chip) => {
        const highlighted = chip.leading || chip.active;
        const color = highlighted ? colors.primaryDeep : colors.text;
        return (
          <Pressable
            key={chip.key}
            onPress={chip.onPress}
            style={({ pressed }) => [
              styles.chip,
              highlighted && styles.chipActive,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: chip.active }}
          >
            {chip.leading ? <Ionicons name="options-outline" size={18} color={color} /> : null}
            <AppText variant="bodyBold" style={[styles.label, { color }]}>
              {chip.label}
            </AppText>
            {!chip.leading ? <Ionicons name="chevron-down" size={16} color={color} /> : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: SCREEN_PADDING, gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    height: 40,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  chipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  label: { fontSize: 14 },
  pressed: { opacity: 0.8 },
});