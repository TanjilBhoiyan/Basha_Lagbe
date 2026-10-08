import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

/** White rounded card with a title, used for each filter group. */
export function FilterSection({
  title,
  right,
  children,
}: {
  title: ReactNode;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        {typeof title === 'string' ? (
          <AppText variant="h3" accessibilityRole="header">
            {title}
          </AppText>
        ) : (
          title
        )}
        {right}
      </View>
      {children}
    </View>
  );
}

/** Square tile with an icon on top (property type, tenant type). */
export function IconTile({
  label,
  icon,
  selected,
  onPress,
  width,
}: {
  label: string;
  icon: IconName;
  selected: boolean;
  onPress: () => void;
  width: number;
}) {
  const color = selected ? colors.primaryDeep : colors.textSecondary;
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tile, { width }, selected && styles.selected]}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label.replace('\n', ' ')}
    >
      <MaterialCommunityIcons name={icon} size={26} color={selected ? colors.primaryDeep : colors.text} />
      <AppText
        variant="caption"
        align="center"
        style={[styles.tileLabel, { color }, selected && styles.bold]}
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.85}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

/** Row of equal buttons, e.g. Any / 1 / 2 / 3 / 4+. */
export function NumberChoice({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  const options: { value: number | null; label: string }[] = [
    { value: null, label: 'Any' },
    { value: 1, label: '1' },
    { value: 2, label: '2' },
    { value: 3, label: '3' },
    { value: 4, label: '4+' },
  ];
  return (
    <View style={styles.numberRow}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.label}
            onPress={() => onChange(o.value)}
            style={[styles.numberBox, selected && styles.selected]}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
          >
            <AppText
              variant={selected ? 'bodyBold' : 'body'}
              color={selected ? 'primaryDeep' : 'text'}
            >
              {o.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Pill with an optional icon (furnishing). */
export function PillChoice({
  label,
  icon,
  selected,
  onPress,
}: {
  label: string;
  icon?: IconName;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.pill, selected && styles.selected]}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
    >
      {icon ? (
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={selected ? colors.primaryDeep : colors.textSecondary}
        />
      ) : null}
      <AppText
        variant={selected ? 'bodyBold' : 'caption'}
        color={selected ? 'primaryDeep' : 'textSecondary'}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

/** Checkbox tile with an icon (amenities). */
export function CheckTile({
  label,
  icon,
  checked,
  onPress,
  width,
}: {
  label: string;
  icon: IconName;
  checked: boolean;
  onPress: () => void;
  width: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.check, { width }, checked && styles.selected]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
    >
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked ? <MaterialCommunityIcons name="check" size={14} color={colors.white} /> : null}
      </View>
      <MaterialCommunityIcons
        name={icon}
        size={18}
        color={checked ? colors.primaryDeep : colors.textSecondary}
      />
      <AppText
        variant="caption"
        style={[styles.checkLabel, checked && styles.checkLabelOn]}
        numberOfLines={1}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selected: { backgroundColor: colors.primaryLight, borderColor: colors.primaryLight },
  bold: { fontWeight: '700' },
  tile: {
    minHeight: 84,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.xs,
  },
  tileLabel: { fontSize: 12, lineHeight: 15 },
  numberRow: { flexDirection: 'row', gap: spacing.sm },
  numberBox: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    height: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  check: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    height: 44,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  box: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: { backgroundColor: colors.primaryDeep, borderColor: colors.primaryDeep },
  checkLabel: { flexShrink: 1, color: colors.text, fontSize: 12 },
  checkLabelOn: { color: colors.primaryDeep, fontWeight: '700' },
});