import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';
import { AppText } from './AppText';

type IconName = ComponentProps<typeof Ionicons>['name'];

type Tab<T extends string> = { value: T; label: string; icon?: IconName };

type Props<T extends string> = {
  tabs: Tab<T>[];
  value: T;
  onChange: (value: T) => void;
  /** `solid` = filled green active tab with white text (Map / List switch). */
  variant?: 'soft' | 'solid';
};

export function SegmentedTabs<T extends string>({
  tabs,
  value,
  onChange,
  variant = 'soft',
}: Props<T>) {
  return (
    <View style={styles.container} accessibilityRole="tablist">
      {tabs.map((tab) => {
        const active = tab.value === value;
        const solid = variant === 'solid';
        const color = active ? (solid ? colors.white : colors.primary) : colors.textSecondary;
        return (
          <Pressable
            key={tab.value}
            onPress={() => onChange(tab.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[styles.tab, active && (solid ? styles.activeSolid : styles.activeTab)]}
          >
            {tab.icon ? <Ionicons name={tab.icon} size={20} color={color} /> : null}
            <AppText variant="bodyBold" style={{ color }}>
              {tab.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: spacing.xs,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 46,
    borderRadius: radius.md,
  },
  activeTab: { backgroundColor: colors.primaryLight },
  activeSolid: { backgroundColor: colors.primaryDeep },
});