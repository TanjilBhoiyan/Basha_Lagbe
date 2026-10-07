import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import type { PropertyType } from '@/types/property';
import { HOME_CATEGORIES, type HomeCategory } from './categories';

type Props = {
  selected: PropertyType | null;
  onSelect: (category: HomeCategory) => void;
};

export function CategoryGrid({ selected, onSelect }: Props) {
  return (
    <View style={styles.grid}>
      {HOME_CATEGORIES.map((category) => {
        const active = category.type !== null && category.type === selected;
        return (
          <Pressable
            key={category.label}
            onPress={() => onSelect(category)}
            style={styles.item}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={category.label}
          >
            <View style={[styles.iconBox, active && styles.iconBoxActive]}>
              <MaterialCommunityIcons
                name={category.icon}
                size={26}
                color={active ? colors.white : colors.primaryDeep}
              />
            </View>
            <AppText
              variant="caption"
              style={[styles.label, active && styles.labelActive]}
              numberOfLines={1}
            >
              {category.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.lg },
  item: { width: '25%', alignItems: 'center', gap: spacing.xs + 2 },
  iconBox: {
    width: 58,
    height: 58,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxActive: { backgroundColor: colors.primary },
  label: { color: colors.text, fontWeight: '500' },
  labelActive: { color: colors.primary, fontWeight: '700' },
});