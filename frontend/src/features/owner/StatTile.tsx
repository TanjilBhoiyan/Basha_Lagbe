import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { radius, spacing } from '@/theme';

type Props = {
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  value: number;
  label: string;
  color: string;
  background: string;
  selected: boolean;
  onPress: () => void;
};

/** Number tile on the Owner Dashboard; tap filters the list below. */
export function StatTile({ icon, value, label, color, background, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: background, borderColor: selected ? color : 'transparent' },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${value} ${label}`}
    >
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name={icon} size={18} color={color} />
        </View>
        <AppText style={styles.value}>{value}</AppText>
      </View>
      <AppText variant="small" color="textSecondary" numberOfLines={1} style={styles.label}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    padding: spacing.sm + 2,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    gap: spacing.xs,
  },
  pressed: { opacity: 0.85 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { fontSize: 22, lineHeight: 28, fontWeight: '800' },
  label: { fontSize: 12, fontWeight: '500' },
});