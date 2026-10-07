import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { formatTimeSlot, type VisitDay } from './visitSlots';

const GAP = 6;

/** Row of day tiles. Fits 7 tiles in `width`; more than 7 scroll sideways. */
export function DateStrip({
  days,
  selected,
  onSelect,
  width,
}: {
  days: VisitDay[];
  selected: string | null;
  onSelect: (iso: string) => void;
  /** Available width (inside the card). */
  width: number;
}) {
  const tileWidth = Math.max(Math.floor((width - GAP * 6) / 7), 44);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {days.map((d) => {
        const active = d.iso === selected;
        return (
          <Pressable
            key={d.iso}
            onPress={() => onSelect(d.iso)}
            style={[styles.day, { width: tileWidth }, active && styles.active]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${d.weekday} ${d.day} ${d.month}`}
          >
            <AppText variant="small" color={active ? 'primaryDeep' : 'textSecondary'} style={styles.weekday}>
              {d.weekday}
            </AppText>
            <AppText style={[styles.dayNum, active && styles.activeText]}>{d.day}</AppText>
            <AppText variant="small" color={active ? 'primaryDeep' : 'textSecondary'} style={styles.weekday}>
              {d.month}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** Horizontal time chips; past / too-soon slots are faded and not tappable. */
export function TimeSlotPicker({
  slots,
  selected,
  isAvailable,
  onSelect,
}: {
  slots: readonly string[];
  selected: string | null;
  isAvailable: (time: string) => boolean;
  onSelect: (time: string) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {slots.map((t) => {
        const available = isAvailable(t);
        const active = available && t === selected;
        return (
          <Pressable
            key={t}
            disabled={!available}
            onPress={() => onSelect(t)}
            style={[styles.time, active && styles.active, !available && styles.unavailable]}
            accessibilityRole="button"
            accessibilityState={{ selected: active, disabled: !available }}
          >
            <AppText
              variant="caption"
              style={[styles.timeText, active && styles.activeText, !available && styles.strike]}
            >
              {formatTimeSlot(t)}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function PickerLabel({ children, right }: { children: string; right?: ReactNode }) {
  return (
    <View style={styles.labelRow}>
      <AppText variant="bodyBold">{children}</AppText>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: GAP },
  day: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  active: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  activeText: { color: colors.primaryDeep },
  weekday: { fontWeight: '400', fontSize: 12, lineHeight: 16 },
  dayNum: { fontSize: 20, lineHeight: 26, fontWeight: '800', color: colors.text },
  time: {
    minWidth: 92,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  timeText: { fontSize: 14, fontWeight: '600', color: colors.text },
  unavailable: { opacity: 0.4, backgroundColor: colors.surface },
  strike: { textDecorationLine: 'line-through' },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});